from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from backend.app.core.config import settings
from backend.app.core.logging import logger
from backend.app.database.models import Base

# Database Engine setup
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    try:
        # If PostgreSQL, attempt to create pgvector extension if not exists
        if "postgresql" in settings.DATABASE_URL:
            with engine.connect() as conn:
                conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
                conn.commit()
                logger.info("Verified pgvector extension in PostgreSQL.")
        
        # Create all tables
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables initialized successfully.")
    except Exception as e:
        logger.warning(f"Could not auto-create tables on primary DB URL: {e}. Falling back to SQLite.")
        fallback_engine = create_engine("sqlite:///./docmind.db", connect_args={"check_same_thread": False})
        Base.metadata.create_all(bind=fallback_engine)
