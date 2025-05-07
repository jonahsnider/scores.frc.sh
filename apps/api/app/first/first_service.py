import asyncio
import httpx
from app.config import frc_events_api_key, frc_events_username

from .types import FrcEventMatchScores, FrcSchedule, FrcMatchLevel


class FirstService:
    """Handles communication with the FRC Events API (FIRST Inspires)."""

    BASE_URL = "https://frc-api.firstinspires.org/v3.0"

    def __init__(
        self, username: str = frc_events_username, api_key: str = frc_events_api_key
    ):
        self.auth = httpx.BasicAuth(username, api_key)

    async def list_event_scores(
        self, year: int, event_code: str, level: FrcMatchLevel
    ) -> FrcEventMatchScores:
        async with httpx.AsyncClient(
            base_url=self.BASE_URL, auth=self.auth
        ) as first_client:
            response = await first_client.get(
                f"/{year}/scores/{event_code}/{level.value}"
            )
            response.raise_for_status()

            return FrcEventMatchScores.model_validate_json(response.text)

    async def get_schedule(self, year: int, event_code: str) -> FrcSchedule:
        async with httpx.AsyncClient(
            base_url=self.BASE_URL, auth=self.auth
        ) as first_client:
            qual_response, playoff_response = await asyncio.gather(
                first_client.get(
                    f"/{year}/schedule/{event_code}",
                    params={"tournamentLevel": FrcMatchLevel.QUALIFICATION.value},
                ),
                first_client.get(
                    f"/{year}/schedule/{event_code}",
                    params={"tournamentLevel": FrcMatchLevel.PLAYOFF.value},
                ),
            )

            qual_response.raise_for_status()
            playoff_response.raise_for_status()

            qual_schedule = FrcSchedule.model_validate_json(qual_response.text)
            playoff_schedule = FrcSchedule.model_validate_json(playoff_response.text)

            return FrcSchedule(
                Schedule=qual_schedule.schedule + playoff_schedule.schedule
            )
