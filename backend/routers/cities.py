from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models.city import City
from schemas.city import CityResponse

router = APIRouter(prefix="/cities", tags=["cities"])

@router.get("/", response_model=List[CityResponse])
def list_cities(db: Session = Depends(get_db)):
    return db.query(City).order_by(City.id).all()

@router.get("/mine", response_model=CityResponse)
def my_city(current_user_id: int, db: Session = Depends(get_db)):
    # temporary query-param version; swap to JWT-based current_user once wired in
    city = db.query(City).filter(City.owner_id == current_user_id).first()
    return city