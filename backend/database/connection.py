from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from configs.config import DATABASE_URL
from sqlalchemy import event

engine_kwargs = {}

# SQLite specific configuration
if DATABASE_URL.startswith("sqlite"):
    engine_kwargs["connect_args"] = {
        "check_same_thread": False
    }

# PostgreSQL specific configuration
else:
    engine_kwargs.update(
        {
            "pool_pre_ping": True,
            "pool_recycle": 1800,
            "pool_size": 10,
            "max_overflow": 20,
        }
    )

engine = create_engine(
    DATABASE_URL,
    **engine_kwargs,
)
# PostgreSQL session timezone
if DATABASE_URL.startswith("postgresql"):

    @event.listens_for(engine, "connect")
    def set_postgres_timezone(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("SET TIME ZONE 'UTC'")
        cursor.close()
        
SessionLocal = sessionmaker(
    autoflush=False,
    autocommit=False,
    bind=engine,
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()