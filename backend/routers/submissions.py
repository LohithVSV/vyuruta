from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from core.security import get_current_user
from core.economy import as_utc, utc_now
from core.game_constants import BATTLE_DURATION_MINUTES
from core.piston_client import run_python
from models.user import User
from models.battle import Battle
from models.sprint import Sprint
from models.problem import Problem
from schemas.submission import SubmissionRequest, SubmissionResult, TestCaseResult
from routers.sprints import (
    _expire_sprint_if_due,
    _settle_winning_battle,
)

router = APIRouter(prefix="/sprints", tags=["submissions"])


def _evaluate_submission(
    sprint_id: int,
    code: str,
    current_user: User,
    db: Session,
    *,
    lock_sprint: bool = False,
):
    submitted_at = utc_now()
    sprint_query = db.query(Sprint).filter(Sprint.id == sprint_id)
    if lock_sprint:
        sprint_query = sprint_query.with_for_update()
    sprint = sprint_query.first()
    if not sprint:
        raise HTTPException(status_code=404, detail="Sprint not found")

    battle = db.query(Battle).filter(Battle.id == sprint.battle_id).first()
    if current_user.id not in (battle.challenger_id, battle.opponent_id):
        raise HTTPException(status_code=403, detail="You're not part of this battle")

    if sprint.status in ("finished", "expired"):
        raise HTTPException(status_code=409, detail=f"This sprint is already {sprint.status}")

    if battle.status != "accepted" or battle.match_started_at is None:
        raise HTTPException(
            status_code=409,
            detail="Both players must join before the coding sprint can start",
        )

    deadline = as_utc(battle.match_started_at) + timedelta(
        minutes=BATTLE_DURATION_MINUTES[battle.difficulty]
    )
    if submitted_at >= deadline:
        _expire_sprint_if_due(sprint, battle, submitted_at)
        db.commit()
        raise HTTPException(
            status_code=409,
            detail="Time is up. The battle ended in a draw.",
        )

    if not sprint.problem_id:
        raise HTTPException(status_code=400, detail="No problem attached to this sprint yet")

    problem = db.query(Problem).filter(Problem.id == sprint.problem_id).first()
    test_cases = problem.test_cases
    if not test_cases:
        raise HTTPException(status_code=400, detail="This problem has no test cases seeded")

    results = []
    passed_count = 0
    for tc in test_cases:
        run_result = run_python(code, stdin=tc.input_data, timeout_ms=problem.time_limit_ms)
        actual = run_result["stdout"].strip()
        expected = tc.expected_output.strip()
        passed = run_result["error"] is None and actual == expected
        if passed:
            passed_count += 1

        results.append(TestCaseResult(
            is_sample=tc.is_sample,
            passed=passed,
            input_data=tc.input_data if tc.is_sample else None,
            expected_output=tc.expected_output if tc.is_sample else None,
            actual_output=run_result["stdout"] if tc.is_sample else None,
            error=run_result["error"] if tc.is_sample else None,
        ))

    return sprint, battle, results, passed_count, submitted_at


@router.post("/{sprint_id}/run", response_model=SubmissionResult)
def run_code(
    sprint_id: int,
    payload: SubmissionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sprint, _, results, passed_count, _ = _evaluate_submission(
        sprint_id, payload.code, current_user, db
    )
    all_passed = passed_count == len(results)
    return SubmissionResult(
        all_passed=all_passed,
        passed_count=passed_count,
        total_count=len(results),
        results=results,
        sprint_status=sprint.status,
        message=(
            "All test cases passed. Submit your solution to claim victory!"
            if all_passed
            else f"{passed_count}/{len(results)} test cases passed. Keep trying."
        ),
    )


@router.post("/{sprint_id}/submit", response_model=SubmissionResult)
def submit_code(
    sprint_id: int,
    payload: SubmissionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sprint, battle, results, passed_count, submitted_at = _evaluate_submission(
        sprint_id, payload.code, current_user, db, lock_sprint=True
    )
    all_passed = passed_count == len(results)

    if not all_passed:
        return SubmissionResult(
            all_passed=False,
            passed_count=passed_count,
            total_count=len(results),
            results=results,
            sprint_status=sprint.status,
            message=f"{passed_count}/{len(results)} test cases passed. Keep trying.",
        )

    # All test cases passed — this player wins the sprint outright.
    deadline = as_utc(battle.match_started_at) + timedelta(
        minutes=BATTLE_DURATION_MINUTES[battle.difficulty]
    )
    if submitted_at >= deadline:
        _expire_sprint_if_due(sprint, battle, submitted_at)
        db.commit()
        raise HTTPException(
            status_code=409,
            detail="Time is up. The battle ended in a draw.",
        )

    claimed = (
        db.query(Sprint)
        .filter(Sprint.id == sprint.id, Sprint.status == "pending")
        .update(
            {
                Sprint.status: "finished",
                Sprint.winner_id: current_user.id,
                Sprint.claimed_winner_id: current_user.id,
            },
            synchronize_session=False,
        )
    )
    if claimed != 1:
        db.rollback()
        raise HTTPException(status_code=409, detail="Another player already won this sprint")

    loser_id = (
        battle.opponent_id
        if current_user.id == battle.challenger_id
        else battle.challenger_id
    )
    loser = db.query(User).filter(User.id == loser_id).first()
    if loser is None:
        raise HTTPException(status_code=404, detail="Battle participant not found")
    sprint.status = "finished"
    sprint.winner_id = current_user.id
    sprint.claimed_winner_id = current_user.id
    _settle_winning_battle(battle, current_user, loser, db)

    db.commit()
    db.refresh(sprint)
    db.refresh(battle)

    return SubmissionResult(
        all_passed=True,
        passed_count=passed_count,
        total_count=len(results),
        results=results,
        sprint_status=sprint.status,
        message="All test cases passed — you win this sprint!",
    )