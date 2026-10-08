from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from database import get_db
from core.security import get_current_user
from core.game_constants import (
    BATTLE_DURATION_MINUTES,
    TRIBUTE_PAYMENT_BY_DIFFICULTY,
    WIN_REWARDS,
)
from core.economy import as_utc, utc_now
from models.user import User
from models.battle import Battle
from models.sprint import Sprint
from models.reward_log import RewardLog
from schemas.sprint import SprintResponse

router = APIRouter(prefix="/sprints", tags=["sprints"])


def _pay_rewards(winner: User, difficulty: int, db: Session):
    reward = WIN_REWARDS[difficulty]
    currency_reward = reward["currency"]
    winner.currency += currency_reward
    db.add(RewardLog(
        user_id=winner.id,
        currency_amount=currency_reward,
        xp_amount=0,
        source="sprint_win",
    ))


def _record_battle_result(winner: User, loser: User) -> None:
    winner.win_streak += 1
    loser.win_streak = 0


def _transfer_battle_tribute(
    battle: Battle,
    winner: User,
    loser: User,
    db: Session,
) -> int:
    amount = min(
        max(loser.currency, 0),
        TRIBUTE_PAYMENT_BY_DIFFICULTY[battle.difficulty],
    )
    loser.currency -= amount
    winner.currency += amount
    battle.tribute_amount = amount
    battle.tribute_choice = "pay" if amount else "skip"
    if amount:
        db.add_all([
            RewardLog(
                user_id=loser.id,
                related_user_id=winner.id,
                currency_amount=-amount,
                xp_amount=0,
                source="battle_tribute",
            ),
            RewardLog(
                user_id=winner.id,
                related_user_id=loser.id,
                currency_amount=amount,
                xp_amount=0,
                source="battle_tribute",
            ),
        ])
    return amount


def _settle_winning_battle(
    battle: Battle,
    winner: User,
    loser: User,
    db: Session,
) -> int:
    _record_battle_result(winner, loser)
    _pay_rewards(winner, battle.difficulty, db)
    amount = _transfer_battle_tribute(battle, winner, loser, db)
    battle.status = "resolved"
    return amount


def _expire_sprint_if_due(sprint: Sprint, battle: Battle, now=None) -> bool:
    if (
        sprint.status != "pending"
        or battle.status != "accepted"
        or battle.match_started_at is None
    ):
        return False

    started_at = as_utc(battle.match_started_at)
    expires_at = started_at + timedelta(
        minutes=BATTLE_DURATION_MINUTES[battle.difficulty]
    )
    if as_utc(now or utc_now()) < expires_at:
        return False

    sprint.status = "expired"
    battle.status = "draw"
    return True


def _resolve_no_show(
    battle: Battle,
    sprint: Sprint,
    winner_id: int,
    loser_id: int,
    db: Session,
):
    winner = db.query(User).filter(User.id == winner_id).first()
    loser = db.query(User).filter(User.id == loser_id).first()
    if winner is None or loser is None:
        raise HTTPException(status_code=404, detail="Battle participant not found")

    sprint.status = "finished"
    sprint.winner_id = winner_id
    sprint.claimed_winner_id = winner_id
    battle.status = "forfeit_resolved"
    _record_battle_result(winner, loser)
    _pay_rewards(winner, battle.difficulty, db)
    _transfer_battle_tribute(battle, winner, loser, db)


@router.get("/mine", response_model=list[SprintResponse])
def get_my_sprints(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sprints = (
        db.query(Sprint)
        .options(joinedload(Sprint.battle))
        .join(Battle, Sprint.battle_id == Battle.id)
        .with_for_update(of=Sprint)
        .filter(
            (Battle.challenger_id == current_user.id)
            | (Battle.opponent_id == current_user.id)
        )
        .order_by(Sprint.created_at.desc())
        .all()
    )
    expired_any = False
    for sprint in sprints:
        battle = sprint.battle
        if battle and _expire_sprint_if_due(sprint, battle):
            expired_any = True
    if expired_any:
        db.commit()
        for sprint in sprints:
            db.refresh(sprint)
    return sprints