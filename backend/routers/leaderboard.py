from datetime import datetime, timedelta, timezone
from typing import Literal

from fastapi import APIRouter, Depends, Query
from sqlalchemy import and_, func
from sqlalchemy.orm import Session

from core.seasons import ensure_active_season
from database import get_db
from models.city import City
from models.reward_log import RewardLog
from models.season import Season
from models.user import User
from schemas.leaderboard import LeaderboardEntry, LeaderboardResponse

router = APIRouter(prefix="/leaderboard", tags=["leaderboard"])


def _as_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def _start_of_this_week() -> datetime:
    now = datetime.now(timezone.utc)
    return (now - timedelta(days=now.weekday())).replace(
        hour=0, minute=0, second=0, microsecond=0
    )


def _leaderboard_entries(
    db: Session,
    season: Season,
    period: Literal["weekly", "season"],
    world: Literal["all", "fire", "water"],
    limit: int,
) -> list[LeaderboardEntry]:
    since = _as_utc(season.starts_at)
    if period == "weekly":
        since = max(since, _start_of_this_week())

    earned_treasure = func.coalesce(func.sum(RewardLog.currency_amount), 0)
    rows = (
        db.query(
            User.id,
            User.username,
            earned_treasure.label("treasure"),
        )
        .outerjoin(City, City.owner_id == User.id)
        .outerjoin(
            RewardLog,
            and_(
                RewardLog.user_id == User.id,
                RewardLog.created_at >= since,
                RewardLog.created_at < _as_utc(season.ends_at),
            ),
        )
    )
    if world == "fire":
        rows = rows.filter(City.subject_cluster == "Agni")
    elif world == "water":
        rows = rows.filter(City.subject_cluster == "Jal")

    rows = (
        rows.group_by(User.id, User.username)
        .order_by(earned_treasure.desc(), User.username)
        .limit(limit)
        .all()
    )
    return [
        LeaderboardEntry(
            user_id=row.id,
            username=row.username,
            treasure=row.treasure,
        )
        for row in rows
    ]


@router.get("/rankings", response_model=LeaderboardResponse)
def leaderboard_rankings(
    period: Literal["weekly", "season"] = Query("weekly"),
    world: Literal["all", "fire", "water"] = Query("all"),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db),
):
    season = ensure_active_season(db)
    return LeaderboardResponse(
        period=period,
        world=world,
        season_start=_as_utc(season.starts_at),
        season_end=_as_utc(season.ends_at),
        entries=_leaderboard_entries(db, season, period, world, limit),
    )


@router.get("/weekly", response_model=list[LeaderboardEntry])
def weekly_leaderboard(
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    season = ensure_active_season(db)
    return _leaderboard_entries(db, season, "weekly", "all", limit)


@router.get("/season", response_model=list[LeaderboardEntry])
def season_leaderboard(
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    season = ensure_active_season(db)
    return _leaderboard_entries(db, season, "season", "all", limit)
