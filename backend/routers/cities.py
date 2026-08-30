from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from core.security import get_current_user
from models.city import City
from models.user import User

router = APIRouter(prefix="/cities", tags=["cities"])


@router.get("/mine")
def get_my_city(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    city = db.query(City).filter(City.owner_id == current_user.id).first()

    if not city:
        raise HTTPException(status_code=404, detail="You don't own a city yet")

    return {
        "id": city.id,
        "name": city.name,
        "cluster": city.cluster,
        "owner_id": city.owner_id,
    }