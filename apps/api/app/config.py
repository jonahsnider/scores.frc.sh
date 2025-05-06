import os
from urllib.parse import urlparse, urlunparse
from dotenv import load_dotenv

load_dotenv("../../../.env")

_raw_database_url = os.getenv("DATABASE_URL")
assert _raw_database_url is not None, "DATABASE_URL env var is not set"

_parsed_url = urlparse(_raw_database_url)
# Replace the scheme with 'postgresql+psycopg'
database_url = urlunparse(
    (
        "postgresql+psycopg",
        _parsed_url.netloc,
        _parsed_url.path,
        _parsed_url.params,
        _parsed_url.query,
        _parsed_url.fragment,
    )
)
