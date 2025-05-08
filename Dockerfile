FROM python:3-alpine

WORKDIR /app

RUN apk add --no-cache uv git

COPY pyproject.toml uv.lock ./

RUN uv sync --no-cache --frozen --no-dev --package app

COPY apps/api/ ./apps/api/

EXPOSE 8000

WORKDIR /app/apps/api

CMD ["uv", "run", "--frozen", "--no-dev", "fastapi", "run", "./app/main.py"]
