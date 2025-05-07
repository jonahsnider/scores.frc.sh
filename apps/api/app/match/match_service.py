import asyncio
from datetime import datetime, timedelta

from app.db.db import engine
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
            if score.winningAlliance == FrcEventMatchWinningAlliance.RED
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
            team.teamNumber
            for team in schedule_match.teams
            if team.station in winning_stations
        ]
        # Parse timestamp
        timestamp = datetime.fromisoformat(schedule_match.startTime)
        # Use totalPoints as score
        score_value = winning_alliance.totalPoints - winning_alliance.foulPoints
        # record_held_for is not available, set to 0
        record_held_for = timedelta()

        return MatchResult(
            score=score_value,
            timestamp=timestamp,
            winning_teams=winning_teams,
            record_held_for=record_held_for,
        )

    async def get_matches(
        self, year: int, event_code: str, event: Event
    ) -> list[EventMatch]:
        """Get all matches for an event."""
        schedule, quals_match_results, playoffs_match_results = await asyncio.gather(
            self.first_service.get_schedule(year, event_code),
            self.first_service.list_event_scores(
                year=year, event_code=event_code, level=FrcMatchLevel.QUALIFICATION
            ),
            self.first_service.list_event_scores(
                year=year, event_code=event_code, level=FrcMatchLevel.PLAYOFF
            ),
        )

        # Build hash map: (level, number) -> FrcEventMatchScore
        score_map: dict[tuple[FrcMatchLevel, int], FrcEventMatchScore] = {}
        for match_score in (
            quals_match_results.MatchScores + playoffs_match_results.MatchScores
        ):
            key: tuple[FrcMatchLevel, int] = (
                match_score.matchLevel,
                match_score.matchNumber,
            )
            score_map[key] = match_score

        finished_matches = [
            match
            for match in schedule.Schedule
            if (match.tournamentLevel, match.matchNumber) in score_map
        ]

        return [
            EventMatch(
                number=match.matchNumber,
                level=(
                    "quals"
                    if match.tournamentLevel == FrcMatchLevel.QUALIFICATION
                    else "playoffs"
                ),
                event=event,
                result=self._frc_score_to_match_result(
                    score_map[(match.tournamentLevel, match.matchNumber)], match
                ),
            )
            for match in finished_matches
        ]

    async def refresh_match_results(self, year: int, event_code: str) -> None:
        """Refresh the match results for an event and save them to the DB"""
        matches = await self.get_matches(
            year,
            event_code,
            # Stubbed out since we don't need the full event data for this
            Event(
                code=event_code,
                first_code=event_code,
                name=event_code,
                week_number=0,
                year=year,
            ),
        )

        async with engine.begin() as session:
            # Create the event if for whatever reason it doesn't exist in the DB
            await session.execute(
                insert(EventModel)
                .values(
                    {
                        "year": year,
                        "code": event_code,
                        "week_number": 1,
                        "name": event_code,
                        "first_code": event_code,
                    }
                )
                .on_conflict_do_nothing()
            )

            # Delete all matches for the event
            event_internal_id_stmt = select(EventModel.internal_id).where(
                EventModel.year == year, EventModel.code == event_code
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
            await session.execute(
                insert(MatchResultModel)
                .values(
                    [
                        {
                            "match_internal_id": select(MatchModel.internal_id).where(
                                MatchModel.match_number == match.number,
                                MatchModel.match_level == match.level,
                            ),
                            "score": match.result.score,
                            "winning_teams": match.result.winning_teams,
                            "timestamp": match.result.timestamp,
                        }
                        for match in matches
                        if match.result is not None
                    ]
                )
                .on_conflict_do_update(
                    index_elements=[MatchResultModel.match_internal_id],
                    set_={
                        "score": MatchResultModel.score,
                        "winning_teams": MatchResultModel.winning_teams,
                        "timestamp": MatchResultModel.timestamp,
                    },
                )
            )
