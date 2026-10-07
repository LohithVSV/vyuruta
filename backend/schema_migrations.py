from datetime import datetime, timedelta, timezone

from sqlalchemy import DateTime, String, inspect, text

from database import Base, engine


ADDITIONAL_COLUMNS = {
    "battles": {
        "challenger_joined_at": DateTime(timezone=True),
        "opponent_joined_at": DateTime(timezone=True),
        "match_started_at": DateTime(timezone=True),
        "tribute_choice": String(),
    },
    "tributes": {
        "expires_at": DateTime(timezone=True),
    },
    "users": {
        "city_xp_updated_at": DateTime(timezone=True),
    },
}


def initialize_database() -> None:
    Base.metadata.create_all(bind=engine)
    with engine.begin() as connection:
        inspector = inspect(connection)
        for table_name, columns in ADDITIONAL_COLUMNS.items():
            existing = {column["name"] for column in inspector.get_columns(table_name)}
            for column_name, column_type in columns.items():
                if column_name not in existing:
                    rendered_type = column_type.compile(dialect=connection.dialect)
                    connection.execute(text(
                        f"ALTER TABLE {table_name} ADD COLUMN {column_name} {rendered_type}"
                    ))

        connection.execute(text(
            "CREATE TABLE IF NOT EXISTS app_migrations "
            "(version INTEGER PRIMARY KEY)"
        ))
        migrated = connection.execute(text(
            "SELECT version FROM app_migrations WHERE version = 1"
        )).first()
        if migrated:
            return

        now = datetime.now(timezone.utc)
        connection.execute(text(
            "UPDATE users SET currency = 5000 WHERE currency = 0"
        ))
        connection.execute(
            text(
                "UPDATE users SET city_xp_updated_at = :now "
                "WHERE city_xp_updated_at IS NULL"
            ),
            {"now": now},
        )
        connection.execute(
            text(
                "UPDATE tributes SET expires_at = :expires_at "
                "WHERE active = TRUE AND expires_at IS NULL"
            ),
            {"expires_at": now + timedelta(days=7)},
        )
        connection.execute(text(
            "INSERT INTO app_migrations (version) VALUES (1)"
        ))
