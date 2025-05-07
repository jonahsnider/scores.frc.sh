from pydantic import BaseModel, Field


class Event(BaseModel):
    first_code: str = Field(serialization_alias="firstCode")
    code: str
    name: str
    week_number: int = Field(serialization_alias="weekNumber")
    year: int
