import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from database.base import Base
from database.connection import engine

Base.metadata.create_all(bind=engine)

print("Tables created successfully.")