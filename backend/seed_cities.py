from database import SessionLocal
from models.city import City

# 200 cities: 100 Agni (fire) + 100 Jal (water).
# These map 1:1 to the 200 city spots on the frontend map
# (5 islands x 20 spots per element). Do not change these numbers
# unless you also change the map art in frontend/src/data/cityData.js.
CLUSTER_COUNTS = {
    "Agni": 100,
    "Jal": 100,
}

db = SessionLocal()

for cluster, count in CLUSTER_COUNTS.items():
    for i in range(1, count + 1):
        name = f"{cluster}-{i:03d}"  # Agni-001 ... Agni-100, Jal-001 ... Jal-100
        existing = db.query(City).filter(City.name == name).first()
        if not existing:
            db.add(City(name=name, subject_cluster=cluster))

db.commit()
db.close()
print("200 cities seeded (100 Agni + 100 Jal)!")