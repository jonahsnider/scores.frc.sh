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
