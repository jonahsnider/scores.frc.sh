from enum import Enum, StrEnum
from pydantic import BaseModel, Field
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
    total_points: int = Field(alias="totalPoints")
    foul_points: int = Field(alias="foulPoints")


class FrcEventMatchScore(BaseModel):
    match_level: FrcMatchLevel = Field(alias="matchLevel")
    match_number: int = Field(alias="matchNumber")
    winning_alliance: FrcEventMatchWinningAlliance = Field(alias="winningAlliance")
    alliances: tuple[FrcEventMatchAlliance, FrcEventMatchAlliance]


class FrcEventMatchScores(BaseModel):
    match_scores: list[FrcEventMatchScore] = Field(alias="MatchScores")


class FrcScheduleMatchTeam(BaseModel):
    team_number: int = Field(alias="teamNumber")
    station: Literal["Red1", "Red2", "Red3", "Blue1", "Blue2", "Blue3"]


class FrcScheduleMatch(BaseModel):
    match_number: int = Field(alias="matchNumber")
    tournament_level: FrcMatchLevel = Field(alias="tournamentLevel")
    teams: list[FrcScheduleMatchTeam]
    start_time: str = Field(alias="startTime")


class FrcSchedule(BaseModel):
    schedule: list[FrcScheduleMatch] = Field(alias="Schedule")
