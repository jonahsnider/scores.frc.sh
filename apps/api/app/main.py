import uvicorn
from datetime import datetime
from typing import Annotated

from fastapi import FastAPI, Path
from pydantic import BaseModel

from app.scores_service import ScoreRecord, ScoresService
from app.db import SessionDep

app = FastAPI(title="scores.frc.sh API", version="2.0.0")


year_path_param = Path(
    title="The year to get the high scores for",
    example=2025,
    ge=2023,
    le=datetime.now().year,
)


class HighScoresResponse(BaseModel):
    high_scores: list[ScoreRecord]


scores_service = ScoresService()


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
    session: SessionDep,
) -> HighScoresResponse:
    return HighScoresResponse(
        high_scores=await scores_service.get_high_scores(session, year)
    )


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
    session: SessionDep,
) -> HighScoresResponse:
    return HighScoresResponse(
        high_scores=await scores_service.get_high_scores(session, year, event)
    )


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
