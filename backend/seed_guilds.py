from database import SessionLocal
from models.guild import Guild
from models.user import User
from models.team import Team

db = SessionLocal()

default_guilds = ["Guild Alpha", "Guild Beta", "Guild Gamma", "Guild Delta"]

for name in default_guilds:
    existing = db.query(Guild).filter(Guild.name == name).first()
    if not existing:
        guild = Guild(name=name, college_name="ANITS")
        db.add(guild)

db.commit()
db.close()

print("Default guilds seeded!")