from datetime import datetime, timedelta
from enum import StrEnum
from typing import List

from sqlalchemy import (
    TEXT,
    TIMESTAMP,
    Enum,
    ForeignKey,
    Index,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

from app.event.types import Event
from app.match.types import EventMatch, MatchResult


class Base(DeclarativeBase):
    pass


class DbMatchLevel(StrEnum):
    QUALIFICATION = "quals"
    PLAYOFF = "playoffs"


class EventModel(Base):
    __tablename__ = "events"
    __table_args__ = (
        Index(None, "year", "code", unique=True),
        Index(None, "year", "first_code", unique=True),
    )

    internal_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    year: Mapped[int]
    code: Mapped[str] = mapped_column(TEXT)
    week_number: Mapped[int]
    name: Mapped[str] = mapped_column(TEXT)
    first_code: Mapped[str] = mapped_column(TEXT)

    matches: Mapped[List["MatchModel"]] = relationship(
        back_populates=lambda: MatchModel.event
    )

    def to_event(self) -> "Event":
        return Event(
            year=self.year,
            code=self.code.upper(),
            name=self.name,
            first_code=self.first_code.upper(),
            week_number=self.week_number,
        )


class MatchModel(Base):
    __tablename__ = "matches"
    __table_args__ = (
        UniqueConstraint("event_internal_id", "match_level", "match_number"),
    )

    internal_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    match_number: Mapped[int]
    match_level: Mapped[DbMatchLevel] = mapped_column(
        Enum(DbMatchLevel, name="match_level")
    )

    event_internal_id: Mapped[int] = mapped_column(
        ForeignKey("events.internal_id", ondelete="CASCADE")
    )
    event: Mapped["EventModel"] = relationship(back_populates=EventModel.matches)

    result: Mapped["MatchResultModel | None"] = relationship(
        back_populates=lambda: MatchResultModel.match
    )

    def to_event_match(self, result: MatchResult | None) -> EventMatch:
        return EventMatch(
            number=self.match_number,
            level=self.match_level.value,
            event=self.event.to_event(),
            result=result,
        )


class MatchResultModel(Base):
    __tablename__ = "match_results"

    score: Mapped[int] = mapped_column(index=True)
    winning_teams: Mapped[List[int]] = mapped_column(JSONB)
    timestamp: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), index=True)

    match_internal_id: Mapped[int] = mapped_column(
        ForeignKey("matches.internal_id", ondelete="CASCADE"), primary_key=True
    )
    match: Mapped["MatchModel"] = relationship(back_populates=MatchModel.result)

    def to_match_result(self, record_held_for: timedelta) -> MatchResult:
        return MatchResult(
            score=self.score,
            timestamp=self.timestamp,
            winning_teams=self.winning_teams,
            record_held_for=record_held_for,
        )
