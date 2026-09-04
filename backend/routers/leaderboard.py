from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
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
    """Top XP earners since the start of this week (Monday 00:00 UTC)."""
    since = _start_of_this_week()
    rows = (
        db.query(User.id, User.username, func.coalesce(func.sum(RewardLog.xp_amount), 0).label("xp"))
        .join(RewardLog, RewardLog.user_id == User.id)
        .filter(RewardLog.created_at >= since)
        .group_by(User.id, User.username)
        .order_by(func.sum(RewardLog.xp_amount).desc())
        .limit(limit)
        .all()
    )
    return [LeaderboardEntry(user_id=r.id, username=r.username, xp=r.xp) for r in rows]


@router.get("/season", response_model=list[LeaderboardEntry])
def season_leaderboard(
    limit: int = Query(20, le=100),
    db: Session = Depends(get_db),
):
    """
    Top XP earners for the season, read straight off User.xp (cumulative).
    NOTE: this is not reset automatically — when a season ends you'll need
    to run a one-off script to zero out User.xp for the next season. Parked
    for now, same as passive growth.
    """
    rows = (
        db.query(User.id, User.username, User.xp)
        .order_by(User.xp.desc())
        .limit(limit)
        .all()
    )
    return [LeaderboardEntry(user_id=r.id, username=r.username, xp=r.xp) for r in rows]