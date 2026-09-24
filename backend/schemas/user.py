from pydantic import BaseModel, EmailStr

class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str
    college_name: str

class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    college_name: str
    currency: int
    xp: int
    win_streak: int
    has_hosting_rights: bool

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"