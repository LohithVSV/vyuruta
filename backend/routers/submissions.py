from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from core.security import get_current_user
from core.piston_client import run_python
from models.user import User
from models.battle import Battle
from models.sprint import Sprint
from models.problem import Problem
from schemas.submission import SubmissionRequest, SubmissionResult, TestCaseResult
from routers.sprints import _pay_rewards, _record_battle_result, _resolve_tribute

router = APIRouter(prefix="/sprints", tags=["submissions"])


def _evaluate_submission(sprint_id: int, code: str, current_user: User, db: Session):
    sprint = db.query(Sprint).filter(Sprint.id == sprint_id).first()
    if not sprint:
        raise HTTPException(status_code=404, detail="Sprint not found")

    battle = db.query(Battle).filter(Battle.id == sprint.battle_id).first()
    if current_user.id not in (battle.challenger_id, battle.opponent_id):
        raise HTTPException(status_code=403, detail="You're not part of this battle")

    if sprint.status == "finished":
        raise HTTPException(status_code=400, detail="This sprint is already finished")

    if battle.status != "accepted" or battle.match_started_at is None:
        raise HTTPException(
            status_code=409,
            detail="Both players must join before the coding sprint can start",
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

    return sprint, battle, results, passed_count


@router.post("/{sprint_id}/run", response_model=SubmissionResult)
def run_code(
    sprint_id: int,
    payload: SubmissionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sprint, _, results, passed_count = _evaluate_submission(
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
    sprint, battle, results, passed_count = _evaluate_submission(
        sprint_id, payload.code, current_user, db
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
    claimed = (
        db.query(Sprint)
        .filter(Sprint.id == sprint.id, Sprint.status != "finished")
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

    db.commit()
    db.refresh(sprint)

    loser_id = (
        battle.opponent_id
        if current_user.id == battle.challenger_id
        else battle.challenger_id
    )
    loser = db.query(User).filter(User.id == loser_id).first()
    if loser is None:
        raise HTTPException(status_code=404, detail="Battle participant not found")
    _record_battle_result(current_user, loser)
    _pay_rewards(current_user, battle.difficulty, db)
    _resolve_tribute(battle)

    db.commit()

    return SubmissionResult(
        all_passed=True,
        passed_count=passed_count,
        total_count=len(results),
        results=results,
        sprint_status=sprint.status,
        message="All test cases passed — you win this sprint!",
    )