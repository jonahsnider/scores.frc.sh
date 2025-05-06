from datetime import datetime, timedelta
from pydantic import BaseModel
from sqlalchemy import select
from app.models import MatchLevel, EventModel, MatchModel, MatchResultModel
from app.event_service import Event
from app.db import engine


class MatchResult(BaseModel):
    def __init__(self, match_result: MatchResultModel, record_held_for: timedelta):
        super().__init__(
            score=match_result.score,
            timestamp=match_result.timestamp,
            winning_teams=match_result.winning_teams,
            record_held_for=record_held_for,
        )

    record_held_for: timedelta
    score: int
    timestamp: datetime
    winning_teams: list[int]


class EventMatch(BaseModel):
    def __init__(self, match: MatchModel, result: MatchResult | None):
        super().__init__(
            number=match.match_number,
            level=match.match_level,
            event=Event(match.event),
            result=result,
        )

    number: int
    level: MatchLevel
    event: Event
    result: MatchResult | None


class ScoresService:
    def _score_records_from_matches(
        self, matches: list[MatchModel]
    ) -> list[EventMatch]:
        score_records: list[EventMatch] = []
        for idx, match in enumerate(matches):
            if idx + 1 < len(matches):
                next_match = matches[idx + 1]
                record_held_for = next_match.result.timestamp - match.result.timestamp
            else:
                record_held_for = timedelta.max

            score_records.append(
                EventMatch(
                    match=match,
                    result=MatchResult(match.result, record_held_for),
                )
            )
        return score_records

    async def get_high_scores(
        self, year: int, event_code: str | None = None
    ) -> list[EventMatch]:
        async with engine.begin() as session:
            query = (
                select(MatchModel)
                .join(MatchModel.event)
                .where(EventModel.year == year)
                .join(MatchModel.result)
            )
            if event_code:
                query = query.where(EventModel.code == event_code.lower())
            query = query.order_by(MatchResultModel.timestamp.asc())

            result = await session.scalars(query)

            records: list[MatchModel] = []
            record: int = -1

            for match in result:
                if match.result.score > record:
                    record = match.result.score
                    records.append(match)

            return self._score_records_from_matches(records)
