from sqlalchemy.ext.asyncio import create_async_engine
from app.config import database_url

engine = create_async_engine(database_url)
