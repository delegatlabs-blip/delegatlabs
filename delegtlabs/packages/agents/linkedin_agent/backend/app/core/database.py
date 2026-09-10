from typing import AsyncGenerator, Any, List, Optional, Dict
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import text
from app.core.config import settings

engine = create_async_engine(
    settings.async_database_url,
    echo=False,
    pool_pre_ping=True,
    pool_size=20,
    max_overflow=10,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

class Base(DeclarativeBase):
    pass

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

def _rows_from_result(result: Any) -> List[Dict[str, Any]]:
    if not result.returns_rows:
        return []
    columns = result.keys()
    return [dict(zip(columns, row)) for row in result.fetchall()]


async def execute_raw_on_session(
    session: AsyncSession,
    sql: str,
    params: Optional[Dict[str, Any]] = None,
) -> List[Dict[str, Any]]:
    """Run SQL on an open session without committing. Caller commits once."""
    result = await session.execute(text(sql), params or {})
    return _rows_from_result(result)


async def execute_raw(sql: str, params: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    """Helper for raw SQL queries returning list of dicts."""
    async with AsyncSessionLocal() as session:
        result = await session.execute(text(sql), params or {})
        rows = _rows_from_result(result)
        # Always commit: INSERT/UPDATE/DELETE ... RETURNING also returns rows, and
        # skipping commit left those writes uncommitted (rolled back on session close).
        await session.commit()
        return rows

async def execute_one_raw(sql: str, params: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
    rows = await execute_raw(sql, params)
    return rows[0] if rows else None
