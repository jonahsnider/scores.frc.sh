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
    async def get_global_high_scores(
        self, session: Session, year: int
    ) -> list[ScoreRecord]:
        result = session.execute(
            select(TopScoreModel, EventModel)
            .join(TopScoreModel.event)
            .where(EventModel.year == year)
            .order_by(TopScoreModel.timestamp.asc())
        )

        world_records: list[TopScoreModel] = []
        record: int = -1

        for row in result:
            match = row.tuple()[0]

            if match.score > record:
                record = match.score
                world_records.append(match)

        score_records: list[ScoreRecord] = []
        for idx, match in enumerate(world_records):
            if idx + 1 < len(world_records):
                next_timestamp = world_records[idx + 1].timestamp
                record_held_for = next_timestamp - match.timestamp
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

    async def get_event_high_scores(
        self, year: int, event_code: str
    ) -> list[ScoreRecord]:
        return []
