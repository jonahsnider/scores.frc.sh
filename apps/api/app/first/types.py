from enum import Enum, StrEnum
from pydantic import BaseModel
from typing import Literal


class FrcMatchLevel(StrEnum):
    QUALIFICATION = "Qualification"
    PLAYOFF = "Playoff"


class FrcEventMatchWinningAlliance(Enum):
    BLUE = 2
    RED = 1
    TIE = None


class FrcEventMatchAlliance(BaseModel):
    alliance: Literal["Red", "Blue"]
    totalPoints: int
    foulPoints: int


class FrcEventMatchScore(BaseModel):
    matchLevel: FrcMatchLevel
    matchNumber: int
    winningAlliance: FrcEventMatchWinningAlliance
    alliances: tuple[FrcEventMatchAlliance, FrcEventMatchAlliance]


class FrcEventMatchScores(BaseModel):
    MatchScores: list[FrcEventMatchScore]


class FrcScheduleMatchTeam(BaseModel):
    teamNumber: int
    station: Literal["Red1", "Red2", "Red3", "Blue1", "Blue2", "Blue3"]


class FrcScheduleMatch(BaseModel):
    matchNumber: int
    tournamentLevel: FrcMatchLevel
    teams: list[FrcScheduleMatchTeam]
    startTime: str


class FrcSchedule(BaseModel):
    Schedule: list[FrcScheduleMatch]
