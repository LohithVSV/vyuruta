from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from datetime import datetime, timezone
from database import get_db
from models.user import User
from models.city import City
from models.battle import Battle
from models.sprint import Sprint
from schemas.user import UserCreate, UserResponse, UserLogin, Token
from core.security import hash_password, verify_password, create_access_token
from core.security import get_current_user
from core.economy import accrue_city_xp

router = APIRouter(prefix="/auth", tags=["auth"])
STARTER_TREASURE = 5000

@router.get("/username-availability")
def username_availability(username: str, db: Session = Depends(get_db)):
    exists = db.query(User.id).filter(User.username == username).first() is not None
    return {"available": not exists}


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
        currency=STARTER_TREASURE,
        city_xp_updated_at=datetime.now(timezone.utc),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    unclaimed_city = (
        db.query(City)
        .filter(City.owner_id.is_(None))
        .order_by(func.random())
        .first()
    )
    if unclaimed_city:
        unclaimed_city.owner_id = new_user.id
        db.commit()

    return new_user


@router.post("/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": str(user.id)})
    return Token(access_token=token)


@router.get("/me", response_model=UserResponse)
def me(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    current_user = (
        db.query(User)
        .filter(User.id == current_user.id)
        .with_for_update()
        .one()
    )
    accrue_city_xp(current_user, db)
    db.commit()
    db.refresh(current_user)
    completed_sprints = (
        db.query(Sprint.winner_id, Sprint.created_at)
        .join(Battle, Battle.id == Sprint.battle_id)
        .filter(
            Sprint.status == "finished",
            Sprint.winner_id.is_not(None),
            or_(
                Battle.challenger_id == current_user.id,
                Battle.opponent_id == current_user.id,
            ),
        )
        .order_by(Sprint.created_at.desc(), Sprint.id.desc())
        .all()
    )
    wins = sum(winner_id == current_user.id for winner_id, _ in completed_sprints)
    current_streak = 0
    for winner_id, _ in completed_sprints:
        if winner_id != current_user.id:
            break
        current_streak += 1
    if current_user.win_streak != current_streak:
        current_user.win_streak = current_streak
        db.commit()
        db.refresh(current_user)
    return {
        "id": current_user.id,
        "email": current_user.email,
        "username": current_user.username,
        "college_name": current_user.college_name,
        "currency": current_user.currency,
        "xp": current_user.xp,
        "win_streak": current_streak,
        "wins": wins,
        "losses": len(completed_sprints) - wins,
        "has_hosting_rights": current_user.has_hosting_rights,
    }