from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User, Team, Guild
from schemas.team import TeamCreate, TeamResponse
from core.security import get_current_user

router = APIRouter(prefix="/teams", tags=["teams"])

@router.post("/", response_model=TeamResponse)
def create_team(team_data: TeamCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    guild = db.query(Guild).filter(Guild.id == team_data.guild_id).first()
    if not guild:
        raise HTTPException(status_code=404, detail="Guild not found")

    if current_user.team_id:
        raise HTTPException(status_code=400, detail="User already in a team")

    new_team = Team(name=team_data.name, guild_id=team_data.guild_id)
    db.add(new_team)
    db.commit()
    db.refresh(new_team)

    current_user.team_id = new_team.id
    db.commit()

    return new_team