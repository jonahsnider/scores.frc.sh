from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import Literal
from app.event.types import Event


class MatchResult(BaseModel):
    record_held_for: timedelta
    score: int
    timestamp: datetime
    winning_teams: list[int]


class EventMatch(BaseModel):
    number: int
    level: Literal["quals", "playoffs"]
    event: Event
    result: MatchResult | None
