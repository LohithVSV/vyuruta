from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_

from database import get_db
from core.security import get_current_user
from models.user import User
from models.city import City
from models.battle import Battle
from models.sprint import Sprint
from schemas.battle import BattleCreate, BattleResponse

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

    new_sprint = Sprint(battle_id=battle.id)
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