from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from core.economy import as_utc, utc_now
from core.piston_client import run_python
from core.security import get_current_user
from database import get_db
from models.daily_challenge import DailyAttempt, DailyChallenge
from models.problem import Problem
from models.reward_log import RewardLog
from models.user import User
from schemas.daily_challenge import (
    DailyAttemptOut,
    DailyChallengeOut,
    DailyLeaderboardEntry,
    DailyLeaderboardOut,
    DailySubmissionResult,
)
from schemas.problem import ProblemDetailOut, ProblemOut
from schemas.submission import SubmissionRequest
from schemas.submission import TestCaseResult

router = APIRouter(prefix="/daily-challenges", tags=["daily challenges"])
DAILY_CHALLENGE_REWARD = 5000


def _today_utc() -> date:
    return datetime.now(timezone.utc).date()


def _get_today_challenge(db: Session) -> DailyChallenge:
    challenge = (
        db.query(DailyChallenge)
        .options(joinedload(DailyChallenge.problem).joinedload(Problem.topics))
        .filter(DailyChallenge.challenge_date == _today_utc())
        .first()
    )
    if challenge is None:
        raise HTTPException(
            status_code=404,
            detail="Today's daily question has not been seeded yet",
        )
    return challenge


def _get_or_create_attempt(
    db: Session,
    challenge: DailyChallenge,
    user: User,
) -> DailyAttempt:
    attempt = (
        db.query(DailyAttempt)
        .filter(
            DailyAttempt.daily_challenge_id == challenge.id,
            DailyAttempt.user_id == user.id,
        )
        .first()
    )
    if attempt is not None:
        return attempt

    attempt = DailyAttempt(
        daily_challenge_id=challenge.id,
        user_id=user.id,
        status="in_progress",
    )
    db.add(attempt)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        attempt = (
            db.query(DailyAttempt)
            .filter(
                DailyAttempt.daily_challenge_id == challenge.id,
                DailyAttempt.user_id == user.id,
            )
            .first()
        )
        if attempt is None:
            raise
    else:
        db.refresh(attempt)
    return attempt


def _locked_attempt(
    db: Session,
    challenge: DailyChallenge,
    user: User,
) -> DailyAttempt:
    attempt = (
        db.query(DailyAttempt)
        .filter(
            DailyAttempt.daily_challenge_id == challenge.id,
            DailyAttempt.user_id == user.id,
        )
        .with_for_update()
        .first()
    )
    if attempt is None:
        attempt = _get_or_create_attempt(db, challenge, user)
        attempt = (
            db.query(DailyAttempt)
            .filter(DailyAttempt.id == attempt.id)
            .with_for_update()
            .first()
        )
    if attempt.status != "in_progress":
        raise HTTPException(
            status_code=409,
            detail=f"Today's challenge is already {attempt.status}",
        )
    return attempt


def _sample_cases(problem: Problem):
    return sorted(
        (case for case in problem.test_cases if case.is_sample),
        key=lambda case: case.id,
    )


def _attempt_payload(attempt: DailyAttempt) -> DailyAttemptOut:
    return DailyAttemptOut(
        status=attempt.status,
        started_at=as_utc(attempt.started_at),
        completed_at=as_utc(attempt.completed_at) if attempt.completed_at else None,
        solve_time_seconds=attempt.solve_time_seconds,
    )


def _run_test_cases(problem: Problem, code: str):
    test_cases = sorted(problem.test_cases, key=lambda case: case.id)
    if not test_cases:
        raise HTTPException(
            status_code=400,
            detail="Today's daily question has no test cases seeded",
        )

    sample_results = []
    hidden_passed_count = 0
    hidden_test_count = 0
    passed_count = 0
    for test_case in test_cases:
        execution = run_python(
            code,
            stdin=test_case.input_data,
            timeout_ms=problem.time_limit_ms,
        )
        actual = execution["stdout"].strip()
        expected = test_case.expected_output.strip()
        passed = execution["error"] is None and actual == expected
        if passed:
            passed_count += 1
        if test_case.is_sample:
            sample_results.append(
                TestCaseResult(
                    is_sample=True,
                    passed=passed,
                    input_data=test_case.input_data,
                    expected_output=test_case.expected_output,
                    actual_output=execution["stdout"],
                    error=execution["error"],
                )
            )
        else:
            hidden_test_count += 1
            if passed:
                hidden_passed_count += 1

    results = list(sample_results)
    if hidden_test_count:
        results.append(
            TestCaseResult(
                is_sample=False,
                passed=hidden_passed_count == hidden_test_count,
            )
        )
    return results, passed_count, len(test_cases), hidden_test_count


def _submission_result(
    *,
    all_passed: bool,
    passed_count: int,
    total_count: int,
    hidden_test_count: int,
    results: list[TestCaseResult],
    status: str,
    message: str,
) -> DailySubmissionResult:
    return DailySubmissionResult(
        all_passed=all_passed,
        passed_count=passed_count,
        total_count=total_count,
        hidden_test_count=hidden_test_count,
        results=results,
        status=status,
        reward=DAILY_CHALLENGE_REWARD if status == "solved" else 0,
        message=message,
    )


@router.get("/today", response_model=DailyChallengeOut)
def get_today_challenge(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    challenge = _get_today_challenge(db)
    attempt = _get_or_create_attempt(db, challenge, current_user)
    problem = ProblemOut.model_validate(challenge.problem).model_dump()
    problem["sample_test_cases"] = _sample_cases(challenge.problem)
    return DailyChallengeOut(
        challenge_date=challenge.challenge_date,
        reward=DAILY_CHALLENGE_REWARD,
        problem=ProblemDetailOut.model_validate(problem),
        attempt=_attempt_payload(attempt),
    )


@router.post("/today/run", response_model=DailySubmissionResult)
def run_daily_solution(
    payload: SubmissionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    challenge = _get_today_challenge(db)
    attempt = _locked_attempt(db, challenge, current_user)
    results, passed_count, total_count, hidden_test_count = _run_test_cases(
        challenge.problem, payload.code
    )
    return _submission_result(
        all_passed=passed_count == total_count,
        passed_count=passed_count,
        total_count=total_count,
        hidden_test_count=hidden_test_count,
        results=results,
        status=attempt.status,
        message=(
            "All test cases passed. Submit your solution to claim 5,000 treasure!"
            if passed_count == total_count
            else f"{passed_count}/{len(results)} test cases passed. Keep trying."
        ),
    )


@router.post("/today/submit", response_model=DailySubmissionResult)
def submit_daily_solution(
    payload: SubmissionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    challenge = _get_today_challenge(db)
    attempt = _locked_attempt(db, challenge, current_user)
    results, passed_count, total_count, hidden_test_count = _run_test_cases(
        challenge.problem, payload.code
    )
    all_passed = passed_count == total_count
    if not all_passed:
        return _submission_result(
            all_passed=False,
            passed_count=passed_count,
            total_count=total_count,
            hidden_test_count=hidden_test_count,
            results=results,
            status=attempt.status,
            message=f"{passed_count}/{len(results)} test cases passed. Keep trying.",
        )

    completed_at = utc_now()
    started_at = as_utc(attempt.started_at)
    solve_time_seconds = max(0, int((completed_at - started_at).total_seconds()))
    user = (
        db.query(User)
        .filter(User.id == current_user.id)
        .with_for_update()
        .first()
    )
    if user is None:
        raise HTTPException(status_code=404, detail="Player not found")

    user.currency += DAILY_CHALLENGE_REWARD
    attempt.status = "solved"
    attempt.completed_at = completed_at
    attempt.solve_time_seconds = solve_time_seconds
    db.add(
        RewardLog(
            user_id=user.id,
            currency_amount=DAILY_CHALLENGE_REWARD,
            xp_amount=0,
            source="daily_challenge",
        )
    )
    db.commit()
    return _submission_result(
        all_passed=True,
        passed_count=passed_count,
        total_count=total_count,
        hidden_test_count=hidden_test_count,
        results=results,
        status="solved",
        message="All test cases passed. You earned 5,000 treasure!",
    )


@router.post("/today/forfeit", response_model=DailyAttemptOut)
def forfeit_daily_challenge(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    challenge = _get_today_challenge(db)
    attempt = _locked_attempt(db, challenge, current_user)
    attempt.status = "forfeited"
    attempt.completed_at = utc_now()
    db.commit()
    db.refresh(attempt)
    return _attempt_payload(attempt)


@router.get("/today/leaderboard", response_model=DailyLeaderboardOut)
def get_today_leaderboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    challenge = _get_today_challenge(db)
    current_attempt = (
        db.query(DailyAttempt)
        .filter(
            DailyAttempt.daily_challenge_id == challenge.id,
            DailyAttempt.user_id == current_user.id,
        )
        .first()
    )
    if current_attempt is None or current_attempt.status not in ("solved", "forfeited"):
        raise HTTPException(
            status_code=403,
            detail="Solve today's question or forfeit to unlock its leaderboard",
        )

    attempts = (
        db.query(DailyAttempt, User.username)
        .join(User, User.id == DailyAttempt.user_id)
        .filter(
            DailyAttempt.daily_challenge_id == challenge.id,
            DailyAttempt.status.in_(("solved", "forfeited")),
        )
        .all()
    )
    attempts.sort(
        key=lambda row: (
            0 if row[0].status == "solved" else 1,
            row[0].solve_time_seconds
            if row[0].solve_time_seconds is not None
            else float("inf"),
            as_utc(row[0].completed_at),
            row[1].casefold(),
        )
    )
    return DailyLeaderboardOut(
        challenge_date=challenge.challenge_date,
        reward=DAILY_CHALLENGE_REWARD,
        entries=[
            DailyLeaderboardEntry(
                rank=index + 1,
                username=username,
                status=attempt.status,
                solve_time_seconds=attempt.solve_time_seconds,
                completed_at=as_utc(attempt.completed_at),
            )
            for index, (attempt, username) in enumerate(attempts)
        ],
    )
