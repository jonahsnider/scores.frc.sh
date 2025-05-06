from sqlalchemy.ext.asyncio import create_async_engine
from app.config import database_url

engine = create_async_engine(database_url)

# TODO: Make a db dir, move this and models.py into it
