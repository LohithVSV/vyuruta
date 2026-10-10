from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, aliased

from core.security import get_current_user
from database import get_db
from models.reward_log import RewardLog
from models.user import User
from schemas.treasure import DailyTreasureStatus, TreasureHistoryEntry

router = APIRouter(prefix="/treasure", tags=["treasure"])
DAILY_TREASURE_AMOUNT = 20000


def _utc_day_bounds(now: datetime | None = None) -> tuple[datetime, datetime]:
    current = now or datetime.now(timezone.utc)
    start = current.astimezone(timezone.utc).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    return start, start + timedelta(days=1)


def _daily_status(db: Session, user: User, now: datetime | None = None):
    start, next_claim_at = _utc_day_bounds(now)
    claimed = (
        db.query(RewardLog.id)
        .filter(
            RewardLog.user_id == user.id,
            RewardLog.source == "daily_treasure",
            RewardLog.created_at >= start,
            RewardLog.created_at < next_claim_at,
        )
        .first()
        is not None
    )
    return DailyTreasureStatus(
        amount=DAILY_TREASURE_AMOUNT,
        claimed_today=claimed,
        next_claim_at=next_claim_at,
        currency=user.currency,
    )


@router.get("/daily", response_model=DailyTreasureStatus)
def daily_treasure_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return _daily_status(db, current_user)


@router.post("/daily/claim", response_model=DailyTreasureStatus)
def claim_daily_treasure(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .filter(User.id == current_user.id)
        .with_for_update()
        .first()
    )
    if user is None:
        raise HTTPException(status_code=404, detail="Player not found")

    status = _daily_status(db, user)
    if status.claimed_today:
        raise HTTPException(
            status_code=409,
            detail="Today's treasure has already been claimed",
        )

    user.currency += DAILY_TREASURE_AMOUNT
    db.add(RewardLog(
        user_id=user.id,
        currency_amount=DAILY_TREASURE_AMOUNT,
        xp_amount=0,
        source="daily_treasure",
    ))
    db.commit()
    db.refresh(user)
    return _daily_status(db, user)


@router.get("/history", response_model=list[TreasureHistoryEntry])
def treasure_history(
    limit: int = Query(10, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    other_player = aliased(User)
    rows = (
        db.query(RewardLog, other_player.username)
        .outerjoin(other_player, RewardLog.related_user_id == other_player.id)
        .filter(
            RewardLog.user_id == current_user.id,
            RewardLog.source == "battle_tribute",
        )
        .order_by(RewardLog.created_at.desc(), RewardLog.id.desc())
        .limit(limit)
        .all()
    )
    return [
        TreasureHistoryEntry(
            id=log.id,
            amount=log.currency_amount,
            related_username=username,
            created_at=log.created_at,
        )
        for log, username in rows
    ]
