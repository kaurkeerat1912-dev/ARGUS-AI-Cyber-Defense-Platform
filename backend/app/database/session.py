"""
Database Session and Engine Management
Supports SQLite (local dev) and Neon / Render PostgreSQL (production).
"""

from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from backend.app.core.config import settings

# Engine configuration: SQLite requires check_same_thread=False
# Neon / Cloud PostgreSQL with asyncpg uses SSL connection
connect_args = {}
if "sqlite" in settings.DATABASE_URL:
    connect_args["check_same_thread"] = False
elif "postgresql+asyncpg" in settings.DATABASE_URL:
    # Neon Serverless PostgreSQL requires SSL and statement_cache_size=0 for pgbouncer/pooling compatibility
    connect_args["ssl"] = "require"
    connect_args["statement_cache_size"] = 0
    connect_args["prepared_statement_cache_size"] = 0

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    connect_args=connect_args,
    pool_pre_ping=True,
    pool_recycle=300 if "postgresql" in settings.DATABASE_URL else -1,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)

Base = declarative_base()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency that yields a database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db() -> None:
    """Initialize database tables and safely migrate timestamp columns if on PostgreSQL."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
        # If running on PostgreSQL, ensure datetime columns are TIMESTAMP WITH TIME ZONE
        if "postgresql" in settings.DATABASE_URL:
            from sqlalchemy import text
            columns_to_migrate = [
                ("investigations", "created_at"),
                ("investigations", "completed_at"),
                ("evidence_items", "created_at"),
                ("behavioral_events", "timestamp"),
                ("event_correlations", "timestamp"),
                ("attack_graphs", "created_at"),
                ("forensic_reports", "created_at"),
                ("defensive_actions", "created_at"),
                ("defensive_actions", "executed_at"),
            ]
            for table, col in columns_to_migrate:
                try:
                    await conn.execute(
                        text(f"ALTER TABLE {table} ALTER COLUMN {col} TYPE TIMESTAMP WITH TIME ZONE USING {col} AT TIME ZONE 'UTC';")
                    )
                except Exception as ex:
                    # Table or column might not exist or already be TIMESTAMPTZ
                    pass
