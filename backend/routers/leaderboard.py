from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from datetime import datetime, timedelta, timezone

from database import get_db
from models.user import User
from models.reward_log import RewardLog
from schemas.leaderboard import LeaderboardEntry

router = APIRouter(prefix="/leaderboard", tags=["leaderboard"])


def _start_of_this_week() -> datetime:
    now = datetime.now(timezone.utc)
    return (now - timedelta(days=now.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)


@router.get("/weekly", response_model=list[LeaderboardEntry])
def weekly_leaderboard(
    limit: int = Query(20, le=100),
    db: Session = Depends(get_db),
):
    """Rank players by net treasure earned this week (Monday 00:00 UTC)."""
    since = _start_of_this_week()
    weekly_treasure = func.coalesce(func.sum(RewardLog.currency_amount), 0)
    rows = (
        db.query(
            User.id,
            User.username,
            weekly_treasure.label("treasure"),
        )
        .outerjoin(
            RewardLog,
            and_(
                RewardLog.user_id == User.id,
                RewardLog.created_at >= since,
            ),
        )
        .group_by(User.id, User.username)
        .order_by(weekly_treasure.desc(), User.username)
        .limit(limit)
        .all()
    )
    return [
        LeaderboardEntry(user_id=r.id, username=r.username, treasure=r.treasure)
        for r in rows
    ]


@router.get("/season", response_model=list[LeaderboardEntry])
def season_leaderboard(
    limit: int = Query(20, le=100),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(User.id, User.username, User.currency)
        .order_by(User.currency.desc(), User.username)
        .limit(limit)
        .all()
    )
    return [
        LeaderboardEntry(user_id=r.id, username=r.username, treasure=r.currency)
        for r in rows
    ]