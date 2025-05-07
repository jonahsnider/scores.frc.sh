from pydantic import BaseModel, Field
from datetime import datetime, timedelta
from typing import Literal
from app.event.types import Event


class MatchResult(BaseModel):
    record_held_for: timedelta = Field(serialization_alias="recordHeldFor")
    score: int
    timestamp: datetime
    winning_teams: list[int] = Field(serialization_alias="winningTeams")


class EventMatch(BaseModel):
    number: int
    level: Literal["quals", "playoffs"]
    event: Event
    result: MatchResult | None
