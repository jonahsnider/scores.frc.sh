from sqlalchemy import delete
from sqlalchemy.dialects.postgresql import insert

from app.db import engine
from app.logger import base_logger
from app.models import EventModel
from app.tba_service import TbaService, TbaEventType
from app.event.types import Event

IGNORED_EVENT_TYPES = {
    TbaEventType.Offseason,
    TbaEventType.Unlabeled,
    TbaEventType.Preseason,
}


class EventService:
    """Pulls in event data from the TBA API and stores it in the DB"""

    logger = base_logger.getChild("event_service")

    def __init__(self, tba_service: TbaService):
        self.tba_service = tba_service

    async def refresh_saved_events(self, year: int) -> None:
        """Refresh the saved events for a given year"""

        # Get the events for the year
        events = await self.get_events_for_year(year)

        async with engine.begin() as session:
            # Insert or update the events in the DB
            upsert_stmt = (
                insert(EventModel)
                .values(
                    [
                        {
                            "year": e.year,
                            "code": e.code,
                            "week_number": e.week_number,
                            "name": e.name,
                            "first_code": e.first_code,
                        }
                        for e in events
                    ]
                )
                .on_conflict_do_update(
                    index_elements=[EventModel.code, EventModel.year],
                    set_=dict(
                        week_number=EventModel.week_number,
                        name=EventModel.name,
                        first_code=EventModel.first_code,
                    ),
                )
            )

            await session.execute(upsert_stmt)
            self.logger.info(f"Inserted {len(events)} events for {year}")

            # Then delete any events in the DB that aren't in the list from TBA
            orphaned_events = await session.execute(
                delete(EventModel)
                .where(EventModel.year == year)
                .where(
                    EventModel.code.notin_(
                        map(
                            lambda e: e.code,
                            events,
                        )
                    )
                )
            )

            self.logger.info(
                f"Deleted {orphaned_events.rowcount} orphaned events for {year}"
            )

    async def get_events_for_year(self, year: int) -> list[Event]:
        """Query events from TBA for a given year"""
        tba_events = await self.tba_service.get_events_for_year(year)

        filtered_events = [
            e
            for e in tba_events
            if e.first_event_code is not None
            and e.event_type not in IGNORED_EVENT_TYPES
        ]

        return [e.to_event() for e in filtered_events]
