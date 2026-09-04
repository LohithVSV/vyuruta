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
from routers.sprints import _pay_rewards, _resolve_tribute

router = APIRouter(prefix="/sprints", tags=["submissions"])


@router.post("/{sprint_id}/submit", response_model=SubmissionResult)
def submit_code(
    sprint_id: int,
    payload: SubmissionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sprint = db.query(Sprint).filter(Sprint.id == sprint_id).first()
    if not sprint:
        raise HTTPException(status_code=404, detail="Sprint not found")

    battle = db.query(Battle).filter(Battle.id == sprint.battle_id).first()
    if current_user.id not in (battle.challenger_id, battle.opponent_id):
        raise HTTPException(status_code=403, detail="You're not part of this battle")

    if sprint.status == "finished":
        raise HTTPException(status_code=400, detail="This sprint is already finished")

    if not sprint.problem_id:
        raise HTTPException(status_code=400, detail="No problem attached to this sprint yet")

    problem = db.query(Problem).filter(Problem.id == sprint.problem_id).first()
    test_cases = problem.test_cases

    if not test_cases:
        raise HTTPException(status_code=400, detail="This problem has no test cases seeded")

    results = []
    passed_count = 0

    for tc in test_cases:
        run_result = run_python(payload.code, stdin=tc.input_data, timeout_ms=problem.time_limit_ms)
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

    all_passed = passed_count == len(test_cases)

    if not all_passed:
        return SubmissionResult(
            all_passed=False,
            passed_count=passed_count,
            total_count=len(test_cases),
            results=results,
            sprint_status=sprint.status,
            message=f"{passed_count}/{len(test_cases)} test cases passed. Keep trying.",
        )

    # All test cases passed — this player wins the sprint outright.
    sprint.status = "finished"
    sprint.winner_id = current_user.id
    sprint.claimed_winner_id = current_user.id
    db.commit()
    db.refresh(sprint)

    winner_id = current_user.id
    loser_id = battle.opponent_id if winner_id == battle.challenger_id else battle.challenger_id

    _pay_rewards(current_user, battle.difficulty, db)
    _resolve_tribute(battle, winner_id, loser_id, db)

    db.commit()

    return SubmissionResult(
        all_passed=True,
        passed_count=passed_count,
        total_count=len(test_cases),
        results=results,
        sprint_status=sprint.status,
        message="All test cases passed — you win this sprint!",
    )