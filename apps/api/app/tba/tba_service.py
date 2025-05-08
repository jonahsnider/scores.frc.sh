import httpx
from app.config import tba_api_key
from app.tba.types import TbaEvent


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
