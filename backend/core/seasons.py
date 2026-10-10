from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from models.season import Season
from models.user import User

SEASON_LENGTH = timedelta(days=28)


def _as_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def ensure_active_season(db: Session) -> Season:
    season = db.query(Season).filter(Season.id == 1).first()
    if season is None:
        now = datetime.now(timezone.utc)
        season = Season(id=1, starts_at=now, ends_at=now + SEASON_LENGTH)
        db.add(season)
        db.commit()
        db.refresh(season)
        return season

    if datetime.now(timezone.utc) < _as_utc(season.ends_at):
        return season

    season = (
        db.query(Season)
        .filter(Season.id == 1)
        .execution_options(populate_existing=True)
        .with_for_update()
        .first()
    )
    now = datetime.now(timezone.utc)
    if now >= _as_utc(season.ends_at):
        starts_at = _as_utc(season.starts_at)
        elapsed_seasons = (now - starts_at) // SEASON_LENGTH
        season.starts_at = starts_at + elapsed_seasons * SEASON_LENGTH
        season.ends_at = season.starts_at + SEASON_LENGTH
        db.query(User).update(
            {User.currency: 0},
            synchronize_session=False,
        )
        db.commit()
        db.refresh(season)
    return season
