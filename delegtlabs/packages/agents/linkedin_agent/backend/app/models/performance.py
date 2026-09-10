import enum
from datetime import datetime
from typing import Optional
from sqlalchemy import Integer, Numeric, DateTime, ForeignKey, Enum as SQLEnum, func
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base

class PerformanceSource(str, enum.Enum):
    API = "api"
    MANUAL = "manual"

class PostPerformance(Base):
    __tablename__ = "post_performance"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    post_id: Mapped[int] = mapped_column(ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)
    likes: Mapped[int] = mapped_column(Integer, default=0)
    comments: Mapped[int] = mapped_column(Integer, default=0)
    shares: Mapped[int] = mapped_column(Integer, default=0)
    impressions: Mapped[int] = mapped_column(Integer, default=0)
    score: Mapped[Optional[float]] = mapped_column(Numeric(8, 3), nullable=True)
    source: Mapped[PerformanceSource] = mapped_column(
        SQLEnum(PerformanceSource, name="performance_source", create_type=False),
        default=PerformanceSource.MANUAL
    )
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
