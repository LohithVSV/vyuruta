from datetime import datetime, timedelta
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import or_
from sqlalchemy.orm import Session

from core.economy import utc_now
from core.security import get_current_user
from database import get_db
from models.battle import Battle
from models.city import City
from models.problem import Problem
from models.quick_play import QuickPlayLock, QuickPlayQueue
from models.sprint import Sprint
from models.user import User
from routers.problems import pick_random_problem

router = APIRouter(prefix="/quick-play", tags=["quick-play"])
QUEUE_TIMEOUT = timedelta(seconds=90)
ACTIVE_BATTLE_STATUSES = ("pending", "accepted")


class QuickPlayResponse(BaseModel):
    status: Literal["idle", "waiting", "matched"]
    online_players: int = Field(ge=0)
    battle_id: int | None = None
    difficulty: int | None = None
    queued_at: datetime | None = None


class QuickPlayJoinRequest(BaseModel):
    difficulty: int = Field(ge=1, le=3)


def _lock_queue(db: Session) -> None:
    db.query(QuickPlayLock).filter(QuickPlayLock.id == 1).with_for_update().one()


def _remove_stale_entries(db: Session, now) -> None:
    db.query(QuickPlayQueue).filter(
        QuickPlayQueue.status == "waiting",
        QuickPlayQueue.last_seen_at < now - QUEUE_TIMEOUT,
    ).delete(synchronize_session=False)


def _remove_ineligible_entries(db: Session) -> None:
    has_active_battle = db.query(Battle.id).filter(
        or_(
            Battle.challenger_id == QuickPlayQueue.user_id,
            Battle.opponent_id == QuickPlayQueue.user_id,
        ),
        Battle.status.in_(ACTIVE_BATTLE_STATUSES),
    ).exists()
    db.query(QuickPlayQueue).filter(
        QuickPlayQueue.status == "waiting",
        has_active_battle,
    ).delete(synchronize_session=False)


def _online_count(db: Session) -> int:
    return db.query(QuickPlayQueue).filter(
        QuickPlayQueue.status == "waiting",
    ).count()


def _active_battle(db: Session, user_id: int):
    return (
        db.query(Battle)
        .filter(
            or_(
                Battle.challenger_id == user_id,
                Battle.opponent_id == user_id,
            ),
            Battle.status.in_(ACTIVE_BATTLE_STATUSES),
        )
        .order_by(Battle.created_at.desc())
        .first()
    )


def _queue_response(
    db: Session,
    status: Literal["idle", "waiting", "matched"],
    battle_id=None,
    entry: QuickPlayQueue | None = None,
):
    db.flush()
    return QuickPlayResponse(
        status=status,
        online_players=_online_count(db),
        battle_id=battle_id,
        difficulty=entry.difficulty if entry else None,
        queued_at=entry.queued_at if entry and status == "waiting" else None,
    )


def _create_match(
    db: Session,
    waiting_entry: QuickPlayQueue,
    current_user: User,
    difficulty: int,
    problem: Problem,
    now,
) -> Battle:
    city = (
        db.query(City)
        .filter(City.owner_id == waiting_entry.user_id)
        .first()
    )
    if city is None:
        city = (
            db.query(City)
            .filter(City.owner_id.is_(None))
            .first()
        )
    if city is None:
        city = db.query(City).first()
    if city is None:
        raise HTTPException(status_code=503, detail="No battle arena is available yet.")

    battle = Battle(
        challenger_id=waiting_entry.user_id,
        opponent_id=current_user.id,
        city_id=city.id,
        difficulty=difficulty,
        match_type="quick_play",
        proposed_time=now,
        challenger_joined_at=None,
        opponent_joined_at=None,
        status="accepted",
    )
    db.add(battle)
    db.flush()
    db.add(Sprint(
        battle_id=battle.id,
        problem_id=problem.id,
        problem_title=problem.title,
    ))
    waiting_entry.status = "matched"
    waiting_entry.battle_id = battle.id
    waiting_entry.last_seen_at = now
    return battle


@router.get("/queue", response_model=QuickPlayResponse)
def get_queue_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _lock_queue(db)
    now = utc_now()
    _remove_stale_entries(db, now)
    _remove_ineligible_entries(db)
    entry = (
        db.query(QuickPlayQueue)
        .filter(QuickPlayQueue.user_id == current_user.id)
        .with_for_update()
        .first()
    )
    if entry is None:
        response = _queue_response(db, "idle")
    elif entry.status == "waiting":
        entry.last_seen_at = now
        response = _queue_response(db, "waiting", entry=entry)
    else:
        battle = db.query(Battle).filter(Battle.id == entry.battle_id).first()
        if battle and battle.status in ACTIVE_BATTLE_STATUSES:
            response = _queue_response(db, "matched", battle.id, entry)
        else:
            db.delete(entry)
            response = _queue_response(db, "idle")
    db.commit()
    return response


@router.post("/queue", response_model=QuickPlayResponse)
def join_queue(
    payload: QuickPlayJoinRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _lock_queue(db)
    now = utc_now()
    _remove_stale_entries(db, now)
    _remove_ineligible_entries(db)
    own_entry = (
        db.query(QuickPlayQueue)
        .filter(QuickPlayQueue.user_id == current_user.id)
        .with_for_update()
        .first()
    )
    if own_entry and own_entry.status == "matched":
        battle = db.query(Battle).filter(Battle.id == own_entry.battle_id).first()
        if battle and battle.status in ACTIVE_BATTLE_STATUSES:
            own_entry.last_seen_at = now
            response = _queue_response(db, "matched", battle.id, own_entry)
            db.commit()
            return response
        db.delete(own_entry)
        own_entry = None

    if _active_battle(db, current_user.id):
        raise HTTPException(
            status_code=409,
            detail="Finish your current battle before starting Quick Play.",
        )

    problem = pick_random_problem(db, difficulty=payload.difficulty)
    if problem is None:
        raise HTTPException(
            status_code=503,
            detail="No active question is available for that difficulty yet.",
        )

    opponent_entry = (
        db.query(QuickPlayQueue)
        .filter(
            QuickPlayQueue.status == "waiting",
            QuickPlayQueue.difficulty == payload.difficulty,
            QuickPlayQueue.user_id != current_user.id,
        )
        .order_by(QuickPlayQueue.queued_at.asc())
        .with_for_update()
        .first()
    )

    if opponent_entry is not None:
        if own_entry is not None:
            db.delete(own_entry)
        battle = _create_match(
            db,
            opponent_entry,
            current_user,
            payload.difficulty,
            problem,
            now,
        )
        db.add(QuickPlayQueue(
            user_id=current_user.id,
            difficulty=payload.difficulty,
            status="matched",
            battle_id=battle.id,
            queued_at=now,
            last_seen_at=now,
        ))
        db.flush()
        response = _queue_response(
            db,
            "matched",
            battle.id,
            db.query(QuickPlayQueue)
            .filter(QuickPlayQueue.user_id == current_user.id)
            .one(),
        )
    else:
        if own_entry is None:
            own_entry = QuickPlayQueue(
                user_id=current_user.id,
                difficulty=payload.difficulty,
                status="waiting",
                queued_at=now,
                last_seen_at=now,
            )
            db.add(own_entry)
        else:
            own_entry.difficulty = payload.difficulty
            own_entry.queued_at = now
            own_entry.last_seen_at = now
        response = _queue_response(db, "waiting", entry=own_entry)

    db.commit()
    return response


@router.delete("/queue", response_model=QuickPlayResponse)
def leave_queue(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _lock_queue(db)
    now = utc_now()
    _remove_stale_entries(db, now)
    _remove_ineligible_entries(db)
    entry = (
        db.query(QuickPlayQueue)
        .filter(QuickPlayQueue.user_id == current_user.id)
        .with_for_update()
        .first()
    )
    if entry is not None and entry.status == "waiting":
        db.delete(entry)
        response = _queue_response(db, "idle")
    elif entry is not None and entry.status == "matched":
        battle = db.query(Battle).filter(Battle.id == entry.battle_id).first()
        if battle and battle.status in ACTIVE_BATTLE_STATUSES:
            response = _queue_response(db, "matched", battle.id, entry)
        else:
            db.delete(entry)
            response = _queue_response(db, "idle")
    else:
        response = _queue_response(db, "idle")
    db.commit()
    return response
