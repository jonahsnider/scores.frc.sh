from datetime import timedelta
from sqlalchemy import select
from app.db.models import EventModel, MatchModel, MatchResultModel
from app.db.db import Session
from .match.types import EventMatch, MatchResult


class ScoresService:
    @staticmethod
    def _match_models_to_event_matches(matches: list[MatchModel]) -> list[EventMatch]:
        score_records: list[EventMatch] = []
        for idx, match in enumerate(matches):
            if match.result is None:
                continue
            record_held_for = timedelta.max
            if idx + 1 < len(matches):
                next_match = matches[idx + 1]
                if next_match.result is not None:
                    record_held_for = (
                        next_match.result.timestamp - match.result.timestamp
                    )

            score_records.append(
                EventMatch(
                    number=match.match_number,
                    level=match.match_level.value,
                    event=match.event.to_event(),
                    result=MatchResult(
                        score=match.result.score,
                        timestamp=match.result.timestamp,
                        winning_teams=match.result.winning_teams,
                        record_held_for=record_held_for,
                    ),
                )
            )
        return score_records

    async def get_high_scores(
        self, year: int, event_code: str | None = None
    ) -> list[EventMatch]:
        async with Session() as session:
            query = (
                select(MatchModel, MatchResultModel, EventModel)
                .join(MatchModel.result)
                .join(MatchModel.event)
                .where(EventModel.year == year)
            )
            if event_code:
                query = query.where(EventModel.code == event_code.upper())
            query = query.order_by(MatchResultModel.timestamp.asc())

            records: list[MatchModel] = []
            record: int = -1

            for match, result, event in await session.execute(query):
                if result.score > record:
                    record = result.score
                    match.result = result
                    match.event = event
                    records.append(match)

            return self._match_models_to_event_matches(records)
