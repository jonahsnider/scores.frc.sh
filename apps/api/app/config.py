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

_raw_tba_api_key = os.getenv("TBA_API_KEY")
assert _raw_tba_api_key is not None, "TBA_API_KEY env var is not set"
tba_api_key = _raw_tba_api_key

_raw_frc_events_api_key = os.getenv("FRC_EVENTS_API_KEY")
assert _raw_frc_events_api_key is not None, "FRC_EVENTS_API_KEY env var is not set"
frc_events_api_key = _raw_frc_events_api_key

_raw_frc_events_username = os.getenv("FRC_EVENTS_USERNAME")
assert _raw_frc_events_username is not None, "FRC_EVENTS_USERNAME env var is not set"
frc_events_username = _raw_frc_events_username

_raw_sentry_dsn = os.getenv("SENTRY_DSN")
assert _raw_sentry_dsn is not None, "SENTRY_DSN env var is not set"
sentry_dsn = _raw_sentry_dsn
