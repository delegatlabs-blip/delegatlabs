"""Database session factory — shared kernel.

Engine is created lazily so the API can boot without a live database during early scaffolding.
"""

from collections.abc import AsyncGenerator
from functools import lru_cache

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from shared.core.config import settings


@lru_cache
def _session_factory() -> async_sessionmaker[AsyncSession]:
    engine = create_async_engine(settings.database_url, echo=settings.debug)
    return async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with _session_factory()() as session:
        yield session
