import logging
from enum import Enum

import httpx
from pydantic import BaseModel
from sqlalchemy import delete
from sqlalchemy.dialects.postgresql import insert

from app.config import tba_api_key
from app.db import engine
from app.models import EventModel

logger = logging.getLogger("app.EventService")


class TbaEventType(Enum):
    Regional = 0
    District = 1
    DistrictCmp = 2
    CmpDivision = 3
    CmpFinals = 4
    DistrictCmpDivision = 5
    Foc = 6
    Remote = 7
    Offseason = 99
    Preseason = 100
    Unlabeled = -1


class TbaEvent(BaseModel):
    week: int | None
    short_name: str | None
    name: str
    event_code: str
    first_event_code: str | None
    event_type: TbaEventType
    year: int


def _normalize_tba_week(event: TbaEvent) -> int:
    if event.week is not None:
        return event.week + 1

    if (
        event.event_type == TbaEventType.CmpDivision
        or event.event_type == TbaEventType.CmpFinals
    ):
        return 8

    raise ValueError(f"Event {event.year} {event.event_code} is missing a week number")


class Event(BaseModel):
    def __init__(self, event: EventModel | TbaEvent):
        if isinstance(event, EventModel):
            super().__init__(
                first_code=event.first_code.upper(),
                code=event.code.upper(),
                name=event.name,
                week_number=event.week_number,
                year=event.year,
            )
        else:
            assert event.first_event_code is not None
            super().__init__(
                first_code=event.first_event_code.upper(),
                code=event.event_code.upper(),
                name=event.short_name or event.name,
                week_number=_normalize_tba_week(event),
                year=event.year,
            )

    first_code: str
    code: str
    name: str
    week_number: int
    year: int


IGNORED_EVENT_TYPES = {
    TbaEventType.Offseason,
    TbaEventType.Unlabeled,
    TbaEventType.Preseason,
}


class EventService:
    """Pulls in event data from the TBA API and stores it in the DB"""

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
            logger.info(f"Inserted {len(events)} events for {year}")

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

            logger.info(
                f"Deleted {orphaned_events.rowcount} orphaned events for {year}"
            )

    async def get_events_for_year(self, year: int) -> list[Event]:
        """Query events from TBA for a given year"""
        async with httpx.AsyncClient(
            headers={"X-TBA-Auth-Key": tba_api_key},
            base_url="https://www.thebluealliance.com/api/v3",
        ) as tba_client:
            response = await tba_client.get(f"/events/{year}")
            all_events = [
                TbaEvent.model_validate(event_json) for event_json in response.json()
            ]

            filtered_events = filter(
                lambda e: e.first_event_code is not None
                and e.event_type not in IGNORED_EVENT_TYPES,
                all_events,
            )

            return list(
                map(
                    lambda e: Event(e),
                    filtered_events,
                ),
            )
