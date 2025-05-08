import asyncio
from datetime import datetime, timedelta

from app.db.db import Session
from app.db.models import EventModel, MatchModel, MatchResultModel
from app.event.types import Event
from app.first.first_service import FirstService
from app.first.types import (
    FrcEventMatchScore,
    FrcEventMatchWinningAlliance,
    FrcMatchLevel,
    FrcScheduleMatch,
)
from app.logger import base_logger
from sqlalchemy import delete, select
from sqlalchemy.dialects.postgresql import insert

from .types import EventMatch, MatchResult


class MatchService:
    def __init__(self, first_service: FirstService):
        self.logger = base_logger.getChild("match_service")
        self.first_service = first_service

    def _frc_score_to_match_result(
        self, score: FrcEventMatchScore, schedule_match: FrcScheduleMatch
    ) -> MatchResult:
        # Find the winning alliance color
        winning_alliance_color = (
            "Red"
            if score.winning_alliance == FrcEventMatchWinningAlliance.RED
            else "Blue"
        )
        # Get the winning alliance object
        winning_alliance = next(
            alliance
            for alliance in score.alliances
            if alliance.alliance == winning_alliance_color
        )
        # Get the team numbers for the winning alliance from the schedule_match
        if winning_alliance_color == "Red":
            winning_stations = {"Red1", "Red2", "Red3"}
        else:
            winning_stations = {"Blue1", "Blue2", "Blue3"}
        winning_teams = [
            # Handle cases where the team number is null
            team.team_number or 0
            for team in schedule_match.teams
            if team.station in winning_stations
        ]
        # Parse timestamp
        assert schedule_match.start_time is not None, "Match isn't scheduled"
        timestamp = datetime.fromisoformat(schedule_match.start_time)
        # Use totalPoints as score
        score_value = winning_alliance.total_points - winning_alliance.foul_points
        # record_held_for is not available, set to 0
        record_held_for = timedelta()

        return MatchResult(
            score=score_value,
            timestamp=timestamp,
            winning_teams=winning_teams,
            record_held_for=record_held_for,
        )

    async def get_matches(
        self, year: int, first_event_code: str, event: Event
    ) -> list[EventMatch]:
        """Get all matches for an event."""
        schedule, quals_match_results, playoffs_match_results = await asyncio.gather(
            self.first_service.get_schedule(year, first_event_code),
            self.first_service.list_event_scores(
                year=year,
                event_code=first_event_code,
                level=FrcMatchLevel.QUALIFICATION,
            ),
            self.first_service.list_event_scores(
                year=year, event_code=first_event_code, level=FrcMatchLevel.PLAYOFF
            ),
        )

        # Build hash map: (level, number) -> FrcEventMatchScore
        score_map: dict[tuple[FrcMatchLevel, int], FrcEventMatchScore] = {}
        for match_score in (
            quals_match_results.match_scores + playoffs_match_results.match_scores
        ):
            key: tuple[FrcMatchLevel, int] = (
                match_score.match_level,
                match_score.match_number,
            )
            score_map[key] = match_score

        finished_matches = [
            match
            for match in schedule.schedule
            if (match.tournament_level, match.match_number) in score_map
        ]

        return [
            EventMatch(
                number=match.match_number,
                level=(
                    "quals"
                    if match.tournament_level == FrcMatchLevel.QUALIFICATION
                    else "playoffs"
                ),
                event=event,
                result=self._frc_score_to_match_result(
                    score_map[(match.tournament_level, match.match_number)], match
                ),
            )
            for match in finished_matches
        ]

    async def get_all_missing_matches(self) -> list[tuple[int, str]]:
        """Returns a list of (year, first_event_code) tuples that have missing matches (no scores in DB)"""
        async with Session() as session:
            incomplete_events = await session.execute(
                select(EventModel.year, EventModel.first_code)
                .join(MatchModel)
                .join(MatchResultModel, full=True)
                .where(MatchResultModel.score.is_(None))
            )

            missing_events = await session.execute(
                select(EventModel.year, EventModel.first_code)
                .join(MatchModel, full=True)
                .where(MatchModel.internal_id.is_(None))
            )

            return list(incomplete_events.tuples()) + list(missing_events.tuples())

    async def refresh_match_results(self, year: int, first_event_code: str) -> None:
        """Refresh the match results for an event and save them to the DB"""
        matches = await self.get_matches(
            year,
            first_event_code,
            # Stubbed out since we don't need the full event data for this
            Event(
                code=first_event_code,
                first_code=first_event_code,
                name=first_event_code,
                week_number=0,
                year=year,
            ),
        )

        if len(matches) == 0:
            # If an event has 0 matches on the schedule, we can't insert anything into the DB
            # An example of this is 2023TUIS3
            return

        async with Session() as session:
            # Delete all matches for the event
            # If the event doesn't exist in the DB, this won't return an event ID
            event_internal_id_stmt = (
                select(EventModel.internal_id)
                .where(
                    EventModel.year == year, EventModel.first_code == first_event_code
                )
                .scalar_subquery()
            )

            await session.execute(
                delete(MatchModel).where(
                    MatchModel.event_internal_id.in_(event_internal_id_stmt)
                )
            )

            # Insert the new matches
            await session.execute(
                insert(MatchModel).values(
                    [
                        {
                            "event_internal_id": event_internal_id_stmt,
                            "match_number": match.number,
                            "match_level": match.level,
                        }
                        for match in matches
                    ]
                )
            )

            # Insert the match results for finished matches
            stmt = insert(MatchResultModel).values(
                [
                    {
                        "match_internal_id": select(MatchModel.internal_id).where(
                            MatchModel.match_number == match.number,
                            MatchModel.match_level == match.level,
                            MatchModel.event_internal_id == event_internal_id_stmt,
                        ),
                        "score": match.result.score,
                        "winning_teams": match.result.winning_teams,
                        "timestamp": match.result.timestamp,
                    }
                    for match in matches
                    if match.result is not None
                ]
            )

            await session.execute(
                stmt.on_conflict_do_update(
                    index_elements=[MatchResultModel.match_internal_id],
                    set_={
                        "score": stmt.excluded.score,
                        "winning_teams": stmt.excluded.winning_teams,
                        "timestamp": stmt.excluded.timestamp,
                    },
                )
            )

            await session.commit()
