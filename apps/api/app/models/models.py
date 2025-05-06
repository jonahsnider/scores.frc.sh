from datetime import datetime
from enum import Enum as PyEnum
from typing import List

from sqlalchemy import TEXT, TIMESTAMP, ForeignKey, Index, PrimaryKeyConstraint
from sqlalchemy.dialects.postgresql import ENUM, JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class MatchLevel(PyEnum):
    QUALIFICATION = "Qualification"
    PLAYOFF = "Playoff"


class Event(Base):
    __tablename__ = "events"
    __table_args__ = (Index(None, "year", "code", unique=True),)

    internal_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    year: Mapped[int]
    code: Mapped[str] = mapped_column(TEXT)
    week_number: Mapped[int]
    name: Mapped[str] = mapped_column(TEXT)
    first_code: Mapped[str] = mapped_column(TEXT)

    top_scores: Mapped[List["TopScore"]] = relationship(back_populates="event")


class TopScore(Base):
    __tablename__ = "top_scores"
    __table_args__ = (
        PrimaryKeyConstraint("event_internal_id", "match_level", "match_number"),
    )

    match_number: Mapped[int]
    score: Mapped[int] = mapped_column(index=True)
    winning_teams: Mapped[List[int]] = mapped_column(JSONB)
    timestamp: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), index=True)
    match_level: Mapped[MatchLevel] = mapped_column(
        ENUM(MatchLevel, name="match_level")
    )
    event_internal_id: Mapped[int] = mapped_column(ForeignKey("events.internal_id"))

    event: Mapped["Event"] = relationship(back_populates="top_scores")
