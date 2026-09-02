from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from core.security import get_current_user
from models.user import User
from models.battle import Battle
from models.sprint import Sprint
from models.tribute import Tribute
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


def _pay_currency_reward(winner: User, db: Session):
    """Pay the winner their reward, siphoning tax off the top for every
    active tribute debt this winner still owes to someone else."""
    reward = WIN_CURRENCY_REWARD

    debts = (
        db.query(Tribute)
        .filter(Tribute.debtor_id == winner.id, Tribute.active == True)  # noqa: E712
        .all()
    )
    for debt in debts:
        tax_amount = max(1, (reward * debt.tax_rate_percent) // 100)
        tax_amount = min(tax_amount, reward)
        creditor = db.query(User).filter(User.id == debt.creditor_id).first()
        if creditor:
            creditor.currency += tax_amount
            reward -= tax_amount

    winner.currency += reward


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

    winner_id = sprint.winner_id
    loser_id = battle.opponent_id if winner_id == battle.challenger_id else battle.challenger_id

    winner = db.query(User).filter(User.id == winner_id).first()
    _pay_currency_reward(winner, db)

    # Did this win clear the winner's own debt to the loser? (a successful rematch)
    cleared_debt = (
        db.query(Tribute)
        .filter(
            Tribute.debtor_id == winner_id,
            Tribute.creditor_id == loser_id,
            Tribute.active == True,  # noqa: E712
        )
        .first()
    )
    if cleared_debt:
        cleared_debt.active = False
        battle.status = "resolved"
    else:
        # Does the loser already owe the winner tax? Losing again escalates it.
        existing_debt = (
            db.query(Tribute)
            .filter(
                Tribute.debtor_id == loser_id,
                Tribute.creditor_id == winner_id,
                Tribute.active == True,  # noqa: E712
            )
            .first()
        )
        if existing_debt:
            existing_debt.tax_rate_percent += 1
            battle.status = "resolved"
        else:
            # First-time loss to this opponent — loser must choose pay vs tax.
            battle.status = "awaiting_tribute"

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

    sprint.status = "pending"
    sprint.claimed_winner_id = None
    db.commit()
    db.refresh(sprint)
    return sprint