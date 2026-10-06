from database import SessionLocal
from models.city import City

# 100 cities: 50 Agni (fire) + 50 Jal (water).
# These map 1:1 to the 100 city spots on the frontend map
# (5 islands x 10 spots per element). Do not change these numbers
# unless you also change the map art in frontend/src/data/cityData.js.
CLUSTER_COUNTS = {
    "Agni": 50,
    "Jal": 50,
}

db = SessionLocal()

for cluster, count in CLUSTER_COUNTS.items():
    for i in range(1, count + 1):
        name = f"{cluster}-{i:03d}"  # Agni-001 ... Agni-050, Jal-001 ... Jal-050
        existing = db.query(City).filter(City.name == name).first()
        if not existing:
            db.add(City(name=name, subject_cluster=cluster))

db.commit()
db.close()
print("100 cities seeded (50 Agni + 50 Jal)!")