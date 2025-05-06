from datetime import datetime, timedelta
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models import MatchLevel, EventModel, TopScoreModel


class Event(BaseModel):
    def __init__(self, event: EventModel):
        super().__init__(
            code=event.code,
            name=event.name,
            week_number=event.week_number,
        )

    code: str
    name: str
    week_number: int


class EventMatch(BaseModel):
    def __init__(self, match: TopScoreModel):
        super().__init__(
            number=match.match_number,
            level=match.match_level,
        )

    number: int
    level: MatchLevel


class ScoreRecord(BaseModel):
    def __init__(
        self, event: EventModel, match: TopScoreModel, record_held_for: timedelta
    ):
        super().__init__(
            event=Event(event),
            match=EventMatch(match),
            record_held_for=record_held_for,
            score=match.score,
            timestamp=match.timestamp,
            winning_teams=match.winning_teams,
        )

    event: Event
    match: EventMatch
    record_held_for: timedelta
    score: int
    timestamp: datetime
    winning_teams: list[int]


class ScoresService:
    def _score_records_from_matches(
        self, matches: list[TopScoreModel]
    ) -> list[ScoreRecord]:
        score_records: list[ScoreRecord] = []
        for idx, match in enumerate(matches):
            if idx + 1 < len(matches):
                next_match = matches[idx + 1]
                record_held_for = next_match.timestamp - match.timestamp
            else:
                record_held_for = timedelta.max

            score_records.append(
                ScoreRecord(
                    event=match.event,
                    match=match,
                    record_held_for=record_held_for,
                )
            )
        return score_records

    async def get_high_scores(
        self, session: Session, year: int, event_code: str | None = None
    ) -> list[ScoreRecord]:
        query = (
            select(TopScoreModel)
            .join(TopScoreModel.event)
            .where(EventModel.year == year)
        )
        if event_code:
            query = query.where(EventModel.code == event_code.lower())
        query = query.order_by(TopScoreModel.timestamp.asc())

        result = session.scalars(query)

        records: list[TopScoreModel] = []
        record: int = -1

        for match in result:
            if match.score > record:
                record = match.score
                records.append(match)

        return self._score_records_from_matches(records)
