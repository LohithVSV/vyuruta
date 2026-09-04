from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_

from database import get_db
from core.security import get_current_user
from core.game_constants import TRIBUTE_PAYMENT_BY_DIFFICULTY, TRIBUTE_TAX_RATE_BY_DIFFICULTY
from models.user import User
from models.city import City
from models.battle import Battle
from models.sprint import Sprint
from models.tribute import Tribute
from schemas.battle import BattleCreate, BattleResponse
from schemas.tribute import TributeChoice
from routers.problems import pick_random_problem

router = APIRouter(prefix="/battles", tags=["battles"])


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
        .filter(
            or_(
                Battle.challenger_id == current_user.id,
                Battle.opponent_id == current_user.id,
            )
        )
        .order_by(Battle.created_at.desc())
        .all()
    )
    return battles


@router.post("/{battle_id}/accept", response_model=BattleResponse)
def accept_battle(
    battle_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    battle = db.query(Battle).filter(Battle.id == battle_id).first()
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
    battle = db.query(Battle).filter(Battle.id == battle_id).first()
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
                detail=f"Not enough currency to pay tribute ({payment_amount} needed) — choose the tax option instead",
            )
        loser.currency -= payment_amount
        winner.currency += payment_amount
    else:  # "tax" — ongoing tax on the loser's future XP earnings
        rate = TRIBUTE_TAX_RATE_BY_DIFFICULTY[battle.difficulty]
        new_debt = Tribute(debtor_id=loser.id, creditor_id=winner.id, tax_rate_percent=rate, active=True)
        db.add(new_debt)

    battle.status = "resolved"
    db.commit()
    db.refresh(battle)
    return battle