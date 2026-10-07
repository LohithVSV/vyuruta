from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_

from database import get_db
from core.security import get_current_user
from core.game_constants import TRIBUTE_PAYMENT_BY_DIFFICULTY
from models.user import User
from models.city import City
from models.battle import Battle
from models.sprint import Sprint
from models.tribute import Tribute
from core.economy import (
    as_utc,
    create_temporary_tribute,
    utc_now,
)
from schemas.activity import RecentBattleActivity
from schemas.battle import BattleCreate, BattleResponse
from schemas.tribute import TributeChoice
from routers.problems import pick_random_problem
from routers.sprints import _resolve_no_show

router = APIRouter(prefix="/battles", tags=["battles"])
NO_SHOW_GRACE = timedelta(minutes=1)


def _settle_no_show_if_due(battle: Battle, db: Session, now=None) -> bool:
    if battle.status != "accepted" or battle.match_started_at is not None:
        return False

    challenger_joined = battle.challenger_joined_at is not None
    opponent_joined = battle.opponent_joined_at is not None
    if challenger_joined == opponent_joined:
        return False

    current_time = as_utc(now or utc_now())
    deadline = as_utc(battle.proposed_time) + NO_SHOW_GRACE
    if current_time < deadline:
        return False

    sprint = (
        db.query(Sprint)
        .filter(Sprint.battle_id == battle.id)
        .with_for_update()
        .first()
    )
    if sprint is None or sprint.status == "finished":
        return False

    claimed = (
        db.query(Battle)
        .filter(
            Battle.id == battle.id,
            Battle.status == "accepted",
            Battle.match_started_at.is_(None),
        )
        .update({Battle.status: "forfeit_resolved"}, synchronize_session=False)
    )
    if claimed != 1:
        db.refresh(battle)
        return False
    battle.status = "forfeit_resolved"

    winner_id = battle.challenger_id if challenger_joined else battle.opponent_id
    loser_id = battle.opponent_id if challenger_joined else battle.challenger_id
    _resolve_no_show(battle, sprint, winner_id, loser_id, db, current_time)
    return True


@router.post("", response_model=BattleResponse)
def propose_battle(
    battle_data: BattleCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    city = db.query(City).filter(City.id == battle_data.city_id).first()
    if not city:
        raise HTTPException(status_code=404, detail="City not found")

    if city.owner_id is None:
        raise HTTPException(status_code=400, detail="City is unclaimed, nothing to battle for")

    if city.owner_id == current_user.id:
        raise HTTPException(status_code=400, detail="You already own this city")

    new_battle = Battle(
        challenger_id=current_user.id,
        opponent_id=city.owner_id,
        city_id=city.id,
        difficulty=battle_data.difficulty,
        proposed_time=battle_data.proposed_time,
        status="pending",
    )
    db.add(new_battle)
    db.commit()
    db.refresh(new_battle)
    return new_battle


@router.get("/mine", response_model=list[BattleResponse])
def get_my_battles(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    battles = (
        db.query(Battle)
        .with_for_update()
        .filter(
            or_(
                Battle.challenger_id == current_user.id,
                Battle.opponent_id == current_user.id,
            )
        )
        .order_by(Battle.created_at.desc())
        .all()
    )
    settled_any = False
    for battle in battles:
        settled_any = _settle_no_show_if_due(battle, db) or settled_any
    if settled_any:
        db.commit()
        for battle in battles:
            db.refresh(battle)
    return battles


@router.get("/recent", response_model=list[RecentBattleActivity])
def get_recent_battles(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Recent challenge activity across the realm."""
    battles = (
        db.query(Battle)
        .options(
            joinedload(Battle.challenger),
            joinedload(Battle.opponent),
            joinedload(Battle.city),
        )
        .order_by(Battle.created_at.desc())
        .limit(10)
        .all()
    )
    return [
        RecentBattleActivity(
            id=battle.id,
            text=f"{battle.challenger.username} challenged {battle.opponent.username} for {battle.city.name}",
            created_at=battle.created_at,
        )
        for battle in battles
    ]


@router.post("/{battle_id}/accept", response_model=BattleResponse)
def accept_battle(
    battle_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    battle = (
        db.query(Battle)
        .filter(Battle.id == battle_id)
        .with_for_update()
        .first()
    )
    if not battle:
        raise HTTPException(status_code=404, detail="Battle not found")

    if battle.opponent_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the challenged player can accept this battle")

    if battle.status != "pending":
        raise HTTPException(status_code=400, detail=f"Battle is already {battle.status}")

    battle.status = "accepted"
    db.commit()
    db.refresh(battle)

    # Pick a problem matching the difficulty the challenger chose.
    problem = pick_random_problem(db, difficulty=battle.difficulty)
    new_sprint = Sprint(
        battle_id=battle.id,
        problem_id=problem.id if problem else None,
        problem_title=problem.title if problem else "No problem seeded yet for this difficulty",
    )
    db.add(new_sprint)
    db.commit()

    return battle


@router.post("/{battle_id}/join", response_model=BattleResponse)
def join_battle(
    battle_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    battle = (
        db.query(Battle)
        .filter(Battle.id == battle_id)
        .with_for_update()
        .first()
    )
    if not battle:
        raise HTTPException(status_code=404, detail="Battle not found")
    if current_user.id not in (battle.challenger_id, battle.opponent_id):
        raise HTTPException(status_code=403, detail="You're not part of this battle")

    if battle.status == "accepted":
        if _settle_no_show_if_due(battle, db):
            db.commit()
            db.refresh(battle)
            return battle
        if battle.status != "accepted":
            return battle

        now = utc_now()
        if current_user.id == battle.challenger_id and battle.challenger_joined_at is None:
            battle.challenger_joined_at = now
        elif current_user.id == battle.opponent_id and battle.opponent_joined_at is None:
            battle.opponent_joined_at = now

        if battle.challenger_joined_at and battle.opponent_joined_at:
            battle.match_started_at = now
        elif _settle_no_show_if_due(battle, db, now):
            db.commit()
            db.refresh(battle)
            return battle

        db.commit()
        db.refresh(battle)
        return battle

    if battle.status in ("resolved", "awaiting_tribute", "forfeit_resolved"):
        return battle
    raise HTTPException(status_code=400, detail=f"Battle is already {battle.status}")


@router.post("/{battle_id}/reject", response_model=BattleResponse)
def reject_battle(
    battle_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    battle = db.query(Battle).filter(Battle.id == battle_id).first()
    if not battle:
        raise HTTPException(status_code=404, detail="Battle not found")

    if battle.opponent_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the challenged player can reject this battle")

    if battle.status != "pending":
        raise HTTPException(status_code=400, detail=f"Battle is already {battle.status}")

    battle.status = "rejected"
    db.commit()
    db.refresh(battle)
    return battle


@router.post("/{battle_id}/tribute", response_model=BattleResponse)
def resolve_tribute(
    battle_id: int,
    choice_data: TributeChoice,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    battle = (
        db.query(Battle)
        .filter(Battle.id == battle_id)
        .with_for_update()
        .first()
    )
    if not battle:
        raise HTTPException(status_code=404, detail="Battle not found")

    if battle.status != "awaiting_tribute":
        raise HTTPException(status_code=400, detail="This battle has no pending tribute decision")

    sprint = db.query(Sprint).filter(Sprint.battle_id == battle.id).first()
    winner_id = sprint.winner_id
    loser_id = battle.opponent_id if winner_id == battle.challenger_id else battle.challenger_id

    if current_user.id != loser_id:
        raise HTTPException(status_code=403, detail="Only the loser of the sprint chooses tribute terms")

    loser = db.query(User).filter(User.id == loser_id).first()
    winner = db.query(User).filter(User.id == winner_id).first()

    payment_amount = TRIBUTE_PAYMENT_BY_DIFFICULTY[battle.difficulty]

    if choice_data.choice == "pay":
        if loser.currency < payment_amount:
            raise HTTPException(
                status_code=400,
                detail=f"Not enough treasure to pay tribute ({payment_amount} needed) — choose the tax option instead",
            )
        loser.currency -= payment_amount
        winner.currency += payment_amount
        battle.tribute_choice = "pay"
        existing_debt = (
            db.query(Tribute)
            .filter(
                Tribute.debtor_id == loser.id,
                Tribute.creditor_id == winner.id,
                Tribute.active.is_(True),
            )
            .first()
        )
        if existing_debt:
            existing_debt.active = False
    else:  # "tax" — ongoing tax on the loser's future XP earnings
        create_temporary_tribute(loser, winner, db)
        battle.tribute_choice = "tax"

    battle.status = "resolved"
    db.commit()
    db.refresh(battle)
    return battle