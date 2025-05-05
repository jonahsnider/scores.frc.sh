from datetime import datetime
from enum import Enum as PyEnum
from typing import List
from sqlalchemy import String, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB, ENUM
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class MatchLevel(PyEnum):
    QUALIFICATION = "Qualification"
    PLAYOFF = "Playoff"


class Event(Base):
    __tablename__ = "events"

    internal_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    year: Mapped[int]
    code: Mapped[str] = mapped_column(String)
    week_number: Mapped[int]
    name: Mapped[str] = mapped_column(String)
    first_code: Mapped[str] = mapped_column(String)

    top_scores: Mapped[List["TopScore"]] = relationship(back_populates="event")


class TopScore(Base):
    __tablename__ = "top_scores"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    match_number: Mapped[int]
    score: Mapped[int]
    winning_teams: Mapped[List[int]] = mapped_column(JSONB)
    timestamp: Mapped[datetime]
    match_level: Mapped[MatchLevel] = mapped_column(
        ENUM(MatchLevel, name="match_level")
    )
    event_internal_id: Mapped[int] = mapped_column(ForeignKey("events.internal_id"))

    event: Mapped["Event"] = relationship(back_populates="top_scores")
