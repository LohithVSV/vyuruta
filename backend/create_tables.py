from database import Base, engine
from models.user import User
from models.city import City
from models.battle import Battle
from models.sprint import Sprint

Base.metadata.create_all(bind=engine)
print("Tables created successfully!")