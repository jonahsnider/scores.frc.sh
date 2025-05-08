from datetime import datetime
from typing import Annotated

from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from fastapi import FastAPI, Path
from pydantic import BaseModel, Field

from app.event.event_service import EventService
from app.first.first_service import FirstService
from app.match.match_service import MatchService
from app.scores_service import EventMatch, ScoresService
from app.tba.tba_service import TbaService
from app.jobs_service import JobsService


tba_service = TbaService()
first_service = FirstService()
scores_service = ScoresService()
event_service = EventService(tba_service)
match_service = MatchService(first_service)
jobs_service = JobsService(event_service, match_service)

app = FastAPI(
    title="scores.frc.sh API", version="2.0.0", lifespan=jobs_service.lifespan
)


origins = [
    "https://scores.frc.sh",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

year_path_param = Path(
    title="The year to get the high scores for",
    example=2025,
    ge=2023,
    le=datetime.now().year,
)


class HighScoresResponse(BaseModel):
    high_scores: list[EventMatch] | None = Field(serialization_alias="highScores")


@app.get(
    "/scores/year/{year}",
    name="Get global high scores",
    summary="Get global high scores",
    description="Get the high scores for a specific year",
    operation_id="getGlobalHighScores",
    tags=["scores"],
    response_model=HighScoresResponse,
)
async def global_high_scores(
    year: Annotated[int, year_path_param],
) -> HighScoresResponse:
    return HighScoresResponse(high_scores=await scores_service.get_high_scores(year))


@app.get(
    "/scores/year/{year}/event/{event}",
    name="Get event high scores",
    summary="Get event high scores",
    description="Get the high scores for a specific event",
    operation_id="getEventHighScores",
    tags=["scores", "event"],
    response_model=HighScoresResponse,
)
async def event_high_scores(
    year: Annotated[int, year_path_param],
    event: Annotated[
        str,
        Path(
            title="The event code to get the high scores for",
            example="CASJ",
            min_length=1,
            max_length=64,
        ),
    ],
) -> HighScoresResponse:
    return HighScoresResponse(
        high_scores=await scores_service.get_high_scores(year, event)
    )


@app.get(
    "/health",
    name="Health check",
    summary="Health check endpoint",
    description="Returns a status to indicate the service is running",
    tags=["health"],
)
async def health_check():
    return {"status": "ok"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
