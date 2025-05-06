from datetime import datetime, timedelta
from typing import Annotated

from fastapi import FastAPI, Path
from pydantic import BaseModel

from app.models.models import MatchLevel


app = FastAPI(title="scores.frc.sh API", version="2.0.0")


year_path_param = Path(
    title="The year to get the high scores for", example=2025, ge=2023
)


class Event(BaseModel):
    code: str
    name: str
    week_number: int


class EventMatch(BaseModel):
    number: int
    level: MatchLevel


class ScoreRecord(BaseModel):
    event: Event
    match: EventMatch
    record_held_for: timedelta
    score: int
    timestamp: datetime
    winning_teams: list[int]


class HighScoresResponse(BaseModel):
    high_scores: list[ScoreRecord]


@app.get(
    "/scores/year/{year}",
    name="Get global high scores",
    summary="Get global high scores",
    description="Get the high scores for a specific year",
    operation_id="getGlobalHighScores",
    tags=["scores"],
)
async def global_high_scores(
    year: Annotated[int, year_path_param],
) -> HighScoresResponse:
    return HighScoresResponse(high_scores=[])


@app.get(
    "/scores/year/{year}/event/{event}",
    name="Get event high scores",
    summary="Get event high scores",
    description="Get the high scores for a specific event",
    operation_id="getEventHighScores",
    tags=["scores", "event"],
)
async def event_high_scores(
    year: Annotated[int, year_path_param],
    event: Annotated[
        str, Path(title="The event code to get the high scores for", example="casj")
    ],
) -> HighScoresResponse:
    return HighScoresResponse(high_scores=[])
