from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from models.city import City
from schemas.user import UserCreate, UserResponse, UserLogin, Token
from core.security import hash_password, verify_password, create_access_token
from core.security import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/signup", response_model=UserResponse)
def signup(user_data: UserCreate, db: Session = Depends(get_db)):
    existing_email = db.query(User).filter(User.email == user_data.email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")

    existing_username = db.query(User).filter(User.username == user_data.username).first()
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already taken")

    new_user = User(
        email=user_data.email,
        username=user_data.username,
        password_hash=hash_password(user_data.password),
        college_name=user_data.college_name,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # auto-assign one unclaimed city
    unclaimed_city = db.query(City).filter(City.owner_id.is_(None)).first()
    if unclaimed_city:
        unclaimed_city.owner_id = new_user.id
        db.commit()

    return new_user