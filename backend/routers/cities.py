from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from database import get_db
from core.security import get_current_user
from models.city import City
from models.user import User

router = APIRouter(prefix="/cities", tags=["cities"])


def _map_id(name: str):
    """
    'Agni-007' -> 'agni-1-7'   (island 1, spot 7 on the frontend map)
    'Jal-014'  -> 'jala-2-4'
    Returns None if the city has no spot on the map.
    """
    try:
        cluster, num = name.split("-")
        n = int(num)
    except ValueError:
        return None
    if n < 1 or n > 50 or cluster not in ("Agni", "Jal"):
        return None
    prefix = "agni" if cluster == "Agni" else "jala"
    return f"{prefix}-{(n - 1) // 10 + 1}-{(n - 1) % 10 + 1}"


def _faction(cluster: str) -> str:
    return "fire" if cluster == "Agni" else "water"


def _city_dict(city: City) -> dict:
    return {
        "id": city.id,
        "name": city.name,
        "subject_cluster": city.subject_cluster,
        "map_id": _map_id(city.name),
        "faction": _faction(city.subject_cluster),
        "owner_id": city.owner_id,
        "owner_username": city.owner.username if city.owner else None,
    }


@router.get("")
def list_cities(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """All cities with their owners. Used to draw the whole map."""
    cities = db.query(City).options(joinedload(City.owner)).order_by(City.id).all()
    return [_city_dict(c) for c in cities]


@router.get("/mine")
def get_my_city(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    city = (
        db.query(City)
        .options(joinedload(City.owner))
        .filter(City.owner_id == current_user.id)
        .first()
    )

    if not city:
        raise HTTPException(status_code=404, detail="You don't own a city yet")

    return _city_dict(city)