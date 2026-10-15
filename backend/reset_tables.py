from sqlalchemy import text

from database import Base, engine
import models  # Register every model and its foreign-key dependencies.
from schema_migrations import initialize_database


confirmation = input(
    "This permanently deletes all Vyuruta app data in the configured database. "
    "Type RESET to continue: "
)
if confirmation != "RESET":
    print("Reset cancelled.")
    raise SystemExit(1)

print("Dropping all Vyuruta application tables...")
Base.metadata.drop_all(bind=engine)
with engine.begin() as connection:
    connection.execute(text("DROP TABLE IF EXISTS app_migrations"))

print("Recreating tables and initializing a clean schema...")
initialize_database()
print("Done! All Vyuruta application tables were recreated.")