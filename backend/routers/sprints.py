from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from core.security import get_current_user
from core.game_constants import WIN_REWARDS, TRIBUTE_TAX_RATE_BY_DIFFICULTY
from models.user import User
from models.battle import Battle
from models.sprint import Sprint
from models.tribute import Tribute
from models.reward_log import RewardLog
from schemas.sprint import SprintResponse

router = APIRouter(prefix="/sprints", tags=["sprints"])


def _get_sprint_or_404(sprint_id: int, db: Session) -> Sprint:
    sprint = db.query(Sprint).filter(Sprint.id == sprint_id).first()
    if not sprint:
        raise HTTPException(status_code=404, detail="Sprint not found")
    return sprint


def _require_participant(sprint: Sprint, battle: Battle, current_user: User):
    if current_user.id not in (battle.challenger_id, battle.opponent_id):
        raise HTTPException(status_code=403, detail="You're not part of this battle")


def _pay_rewards(winner: User, difficulty: int, db: Session):
    """
    Pay the winner their currency + XP reward for this difficulty.
    Currency is never taxed (it's just cosmetics money). XP is taxed by
    any active tribute debts this winner owes to someone else — that XP
    goes to the creditor instead, since XP is what the leaderboard runs on.
    """
    reward = WIN_REWARDS[difficulty]
    currency_reward = reward["currency"]
    xp_reward = reward["xp"]

    winner.currency += currency_reward

    remaining_xp = xp_reward
    debts = (
        db.query(Tribute)
        .filter(Tribute.debtor_id == winner.id, Tribute.active == True)  # noqa: E712
        .all()
    )
    for debt in debts:
        tax_amount = max(1, (xp_reward * debt.tax_rate_percent) // 100)
        tax_amount = min(tax_amount, remaining_xp)
        creditor = db.query(User).filter(User.id == debt.creditor_id).first()
        if creditor:
            creditor.xp += tax_amount
        remaining_xp -= tax_amount

    winner.xp += remaining_xp

    db.add(RewardLog(
        user_id=winner.id,
        currency_amount=currency_reward,
        xp_amount=remaining_xp,
        source="sprint_win",
    ))


def _resolve_tribute(battle: Battle, winner_id: int, loser_id: int, db: Session):
    """
    Runs after a sprint has a confirmed winner. Checks whether this win
    clears an existing debt (rematch win), escalates an existing debt
    (repeat loss), or opens a fresh pay-vs-tax choice (first-time loss).
    Sets battle.status accordingly. Caller is responsible for db.commit().
    """
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
        return

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
        existing_debt.tax_rate_percent += TRIBUTE_TAX_RATE_BY_DIFFICULTY[battle.difficulty]
        battle.status = "resolved"
    else:
        battle.status = "awaiting_tribute"


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

    sprint.status = "finished"
    sprint.winner_id = sprint.claimed_winner_id
    db.commit()
    db.refresh(sprint)

    winner_id = sprint.winner_id
    loser_id = battle.opponent_id if winner_id == battle.challenger_id else battle.challenger_id

    winner = db.query(User).filter(User.id == winner_id).first()
    _pay_rewards(winner, battle.difficulty, db)
    _resolve_tribute(battle, winner_id, loser_id, db)

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