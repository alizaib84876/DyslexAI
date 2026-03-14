"""Create all tables from models then seed exercises."""
import os, sys
os.environ.setdefault("DATABASE_URL", "sqlite:///./dyslexia.db")

# make sure the app package is importable from this directory
sys.path.insert(0, ".")

from app.database import engine, Base
import app.models  # noqa: F401 — registers all models

print("Creating tables...")
Base.metadata.create_all(bind=engine)
print("Tables created. Running seed...")

# Now run seed
exec(open("db/seed.py").read())
