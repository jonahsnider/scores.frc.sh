from contextlib import asynccontextmanager
from datetime import datetime

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from fastapi import FastAPI
from pytz import utc

from app.event.event_service import EventService
from app.logger import base_logger

MIN_YEAR = 2023
MAX_YEAR = datetime.now().year


class JobsService:
    _scheduler = AsyncIOScheduler(timezone=utc)
    _logger = base_logger.getChild("jobs_service")

    def __init__(self, event_service: EventService):
        self.event_service = event_service

        self._scheduler.add_job(
            self._refresh_events_job,
            IntervalTrigger(days=1),
            id="refresh_events",
        )

    async def _refresh_events_job(self):
        self._logger.info("Refreshing events")
        for year in range(MIN_YEAR, MAX_YEAR + 1):
            self._logger.info(f"Refreshing events for {year}")
            await self.event_service.refresh_saved_events(year)
            self._logger.info(f"Refreshed events for {year}")
        self._logger.info("Refreshed all events")

    @asynccontextmanager
    async def lifespan(self, app: FastAPI):
        self._logger.info("Starting scheduler")
        self._scheduler.start()
        yield
        self._logger.info("Shutting down scheduler")
        self._scheduler.shutdown()
