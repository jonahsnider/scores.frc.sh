import httpx
from app.config import tba_api_key
from pydantic import BaseModel
from enum import Enum
from app.event.types import Event


class TbaEventType(Enum):
    REGIONAL = 0
    DISTRICT = 1
    DISTRICT_CMP = 2
    CMP_DIVISION = 3
    CMP_FINALS = 4
    DISTRICT_CMP_DIVISION = 5
    FOC = 6
    REMOTE = 7
    OFFSEASON = 99
    PRESEASON = 100
    UNLABELED = -1


class TbaEvent(BaseModel):
    week: int | None
    short_name: str | None
    name: str
    event_code: str
    first_event_code: str | None
    event_type: TbaEventType
    year: int

    def _normalize_tba_week(self) -> int:
        if self.week is not None:
            return self.week + 1

        if (
            self.event_type == TbaEventType.CMP_DIVISION
            or self.event_type == TbaEventType.CMP_FINALS
        ):
            return 8

        raise ValueError(
            f"Event {self.year} {self.event_code} is missing a week number"
        )

    def to_event(self) -> Event:
        assert self.first_event_code is not None
        return Event(
            year=self.year,
            code=self.event_code.upper(),
            name=self.name,
            first_code=self.first_event_code.upper(),
            week_number=self._normalize_tba_week(),
        )


class TbaService:
    """Handles communication with The Blue Alliance (TBA) API."""

    BASE_URL = "https://www.thebluealliance.com/api/v3"

    def __init__(self, api_key: str = tba_api_key):
        self.api_key = api_key

    async def get_events_for_year(self, year: int) -> list[TbaEvent]:
        async with httpx.AsyncClient(
            headers={"X-TBA-Auth-Key": self.api_key},
            base_url=self.BASE_URL,
        ) as tba_client:
            response = await tba_client.get(f"/events/{year}")
            response.raise_for_status()
            return [
                TbaEvent.model_validate(event_json) for event_json in response.json()
            ]
