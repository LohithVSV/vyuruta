from models.user import User
from models.city import City
from models.battle import Battle
from models.sprint import Sprint
from models.tribute import Tribute
from models.problem import Problem
from models.testcase import TestCase
from models.reward_log import RewardLog
from schema_migrations import initialize_database

initialize_database()
print("Tables created successfully!")