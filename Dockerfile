FROM python:3-alpine

WORKDIR /app

RUN apk add --no-cache uv git gcc musl-dev libpq-dev curl

HEALTHCHECK --interval=15s --timeout=15s --start-period=5s --retries=3 CMD [ "curl", "-f", "http://localhost:8000/health" ]

COPY pyproject.toml uv.lock ./

RUN uv sync --no-cache --frozen --no-dev --package app

RUN uv tool install fastapi[standard]

COPY apps/api/ ./apps/api/

WORKDIR /app/apps/api

CMD ["fastapi", "run", "./app/main.py"]
