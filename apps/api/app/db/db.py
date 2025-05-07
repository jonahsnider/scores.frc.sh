from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.ext.asyncio.session import async_sessionmaker
from app.config import database_url

_engine = create_async_engine(database_url)

Session = async_sessionmaker(_engine)
