FROM python:3-alpine

WORKDIR /app

RUN --mount=type=cache,target=/etc/apk/cache apk add --no-cache uv git gcc libpq-dev curl

HEALTHCHECK --interval=15s --timeout=15s --start-period=5s --retries=3 CMD [ "curl", "-f", "http://localhost:8000/health" ]

COPY pyproject.toml uv.lock ./

# https://docs.astral.sh/uv/guides/integration/docker/#caching
ENV UV_LINK_MODE=copy
RUN --mount=type=cache,target=/root/.cache/uv uv sync --frozen --no-dev --package app

RUN --mount=type=cache,target=/etc/apk/cache apk del git

COPY apps/api/ ./apps/api/

WORKDIR /app/apps/api

EXPOSE 8000

CMD ["uv", "run", "--frozen", "--no-dev", "fastapi", "run", "./app/main.py"]
