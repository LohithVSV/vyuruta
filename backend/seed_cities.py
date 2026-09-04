from database import SessionLocal
from models.city import City

# 300 cities across 2 elemental clusters
CLUSTER_COUNTS = {
    "Agni": 150,
    "Jal": 150,
}

db = SessionLocal()

for cluster, count in CLUSTER_COUNTS.items():
    for i in range(1, count + 1):
        name = f"{cluster}-{i:03d}"  # e.g. Agni-001 ... Agni-150
        existing = db.query(City).filter(City.name == name).first()
        if not existing:
            db.add(City(name=name, subject_cluster=cluster))

db.commit()
db.close()
print("300 cities seeded across 2 clusters!")