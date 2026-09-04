from database import Base, engine
from models.user import User
from models.city import City
from models.battle import Battle
from models.sprint import Sprint
from models.tribute import Tribute
from models.problem import Problem
from models.testcase import TestCase
from models.reward_log import RewardLog

print("Dropping all tables...")
Base.metadata.drop_all(bind=engine)
print("Creating all tables fresh...")
Base.metadata.create_all(bind=engine)
print("Done! All tables recreated from current models.")