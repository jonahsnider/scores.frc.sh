from contextlib import asynccontextmanager
from datetime import datetime

from apscheduler.schedulers.asyncio import AsyncIOScheduler  # type: ignore
from apscheduler.triggers.interval import IntervalTrigger  # type: ignore
from fastapi import FastAPI
from pytz import utc

from app.event.event_service import EventService
from app.logger import base_logger
from app.match.match_service import MatchService

MIN_YEAR = 2023
MAX_YEAR = datetime.now().year


class JobsService:
    _scheduler = AsyncIOScheduler(timezone=utc)
    _logger = base_logger.getChild("jobs_service")

    def __init__(self, event_service: EventService, match_service: MatchService):
        self.event_service = event_service
        self.match_service = match_service

        self._scheduler.add_job(  # type: ignore
            self._refresh_events_job, IntervalTrigger(days=1), max_instances=1
        )
        self._scheduler.add_job(  # type: ignore
            self._refresh_match_results_job, IntervalTrigger(minutes=5), max_instances=1
        )

    async def _refresh_events_job(self) -> None:
        self._logger.info("Refreshing events")
        try:
            for year in range(MIN_YEAR, MAX_YEAR + 1):
                self._logger.info(f"Refreshing events for {year}")
                await self.event_service.refresh_saved_events(year)
                self._logger.info(f"Refreshed events for {year}")
            self._logger.info("Refreshed all events")
        except Exception as e:
            self._logger.error("Error refreshing events", e)

    async def _refresh_match_results_job(self) -> None:
        self._logger.info("Refreshing missing match results")
        missing_events = await self.match_service.get_all_missing_matches()
        self._logger.info(f"Found {len(missing_events)} missing match results")
        for year, first_event_code in missing_events:
            self._logger.info(f"Refreshing match results for {year} {first_event_code}")
            try:
                await self.match_service.refresh_match_results(year, first_event_code)
                self._logger.info(
                    f"Refreshed match results for {year} {first_event_code}"
                )
            except Exception as e:
                self._logger.error(
                    f"Error refreshing match results for {year} {first_event_code}", e
                )

        self._logger.info("Refreshed all match results")

    @asynccontextmanager
    async def lifespan(self, app: FastAPI):
        self._logger.info("Starting scheduler")
        self._scheduler.start()
        yield
        self._logger.info("Shutting down scheduler")
        self._scheduler.shutdown()
