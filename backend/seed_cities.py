from database import SessionLocal
from models.city import City

# 300 cities across 6 elemental clusters
CLUSTER_COUNTS = {
    "Agni": 50,
    "Vaayu": 50,
    "Jal": 50,
    "Kaal": 50,
    "Bhoomi": 50,
    "Akasha": 50,
}

db = SessionLocal()

for cluster, count in CLUSTER_COUNTS.items():
    for i in range(1, count + 1):
        name = f"{cluster}-{i:03d}"  # e.g. Agni-001 ... Agni-050
        existing = db.query(City).filter(City.name == name).first()
        if not existing:
            db.add(City(name=name, subject_cluster=cluster))

db.commit()
db.close()
print("300 cities seeded across 6 clusters!")