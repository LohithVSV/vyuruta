from database import Base, engine
from models.user import User
from models.city import City

Base.metadata.create_all(bind=engine)
print("Tables created successfully!")