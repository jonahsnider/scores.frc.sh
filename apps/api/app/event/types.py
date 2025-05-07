from pydantic import BaseModel


class Event(BaseModel):
    first_code: str
    code: str
    name: str
    week_number: int
    year: int
