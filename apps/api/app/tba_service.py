import httpx
from app.config import tba_api_key
from pydantic import BaseModel
from enum import Enum


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
            return [
                TbaEvent.model_validate(event_json) for event_json in response.json()
            ]
