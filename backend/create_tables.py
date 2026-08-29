from database import Base, engine
from models.user import User
from models.team import Team
from models.guild import Guild

Base.metadata.create_all(bind=engine)
print("Tables created successfully!")