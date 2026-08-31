from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from core.security import get_current_user
from models.user import User
from models.battle import Battle
from models.sprint import Sprint
from schemas.sprint import SprintResponse

router = APIRouter(prefix="/sprints", tags=["sprints"])

WIN_CURRENCY_REWARD = 100


def _get_sprint_or_404(sprint_id: int, db: Session) -> Sprint:
    sprint = db.query(Sprint).filter(Sprint.id == sprint_id).first()
    if not sprint:
        raise HTTPException(status_code=404, detail="Sprint not found")
    return sprint


def _require_participant(sprint: Sprint, battle: Battle, current_user: User):
    if current_user.id not in (battle.challenger_id, battle.opponent_id):
        raise HTTPException(status_code=403, detail="You're not part of this battle")


@router.get("/mine", response_model=list[SprintResponse])
def get_my_sprints(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sprints = (
        db.query(Sprint)
        .join(Battle, Sprint.battle_id == Battle.id)
        .filter(
            (Battle.challenger_id == current_user.id)
            | (Battle.opponent_id == current_user.id)
        )
        .order_by(Sprint.created_at.desc())
        .all()
    )
    return sprints


@router.post("/{sprint_id}/claim", response_model=SprintResponse)
def claim_win(
    sprint_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sprint = _get_sprint_or_404(sprint_id, db)
    battle = db.query(Battle).filter(Battle.id == sprint.battle_id).first()
    _require_participant(sprint, battle, current_user)

    if sprint.status != "pending":
        raise HTTPException(status_code=400, detail=f"Sprint is already {sprint.status}")

    sprint.status = "claimed"
    sprint.claimed_winner_id = current_user.id
    db.commit()
    db.refresh(sprint)
    return sprint


@router.post("/{sprint_id}/confirm", response_model=SprintResponse)
def confirm_win(
    sprint_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sprint = _get_sprint_or_404(sprint_id, db)
    battle = db.query(Battle).filter(Battle.id == sprint.battle_id).first()
    _require_participant(sprint, battle, current_user)

    if sprint.status != "claimed":
        raise HTTPException(status_code=400, detail="No pending claim to confirm")

    if current_user.id == sprint.claimed_winner_id:
        raise HTTPException(status_code=400, detail="You can't confirm your own claim")

    # Resolve the sprint
    sprint.status = "finished"
    sprint.winner_id = sprint.claimed_winner_id
    db.commit()
    db.refresh(sprint)

    winner = db.query(User).filter(User.id == sprint.winner_id).first()
    winner.currency += WIN_CURRENCY_REWARD

    # If the challenger won, they take the city. If the defender won, nothing moves.
    if sprint.winner_id == battle.challenger_id:
        battle.city.owner_id = battle.challenger_id

    db.commit()
    db.refresh(sprint)
    return sprint


@router.post("/{sprint_id}/dispute", response_model=SprintResponse)
def dispute_win(
    sprint_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sprint = _get_sprint_or_404(sprint_id, db)
    battle = db.query(Battle).filter(Battle.id == sprint.battle_id).first()
    _require_participant(sprint, battle, current_user)

    if sprint.status != "claimed":
        raise HTTPException(status_code=400, detail="No pending claim to dispute")

    if current_user.id == sprint.claimed_winner_id:
        raise HTTPException(status_code=400, detail="You can't dispute your own claim")

    # Reset back to pending so either player can claim again
    sprint.status = "pending"
    sprint.claimed_winner_id = None
    db.commit()
    db.refresh(sprint)
    return sprint