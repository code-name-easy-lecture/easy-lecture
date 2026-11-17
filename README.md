## Repository layout

- `apps/web`: Next.js frontend
- `services/retrieval`: Python retrieval service (AWS Lambda)
- `packages/shared`: shared code and types
- `infra`: infrastructure as code
- `docs`: documentation

## Getting started

See the README in each folder for setup steps. You need Node 24 and Python 3.12 or newer.

## Local database

Postgres runs in Docker on your laptop. It is Postgres 18, the same major version Neon runs for staging and the pilot. You need Docker Desktop or another Docker engine.

    cp .env.example .env          (Windows: copy .env.example .env)
    docker compose up -d --wait

`--wait` returns once the database passes its healthcheck. It then listens on `localhost:5432`, with the user, password and database name from `.env`. Nothing in the repo connects to it yet; sign-in will be the first thing that does.

    docker compose ps                                              (should say "healthy")
    docker compose exec postgres psql -U easylecture -d easylecture
    docker compose down                                            (stop, keep the data)
    docker compose down -v                                         (stop and delete the data)

The data lives in a Docker volume named `easy-lecture_postgres-data`, so it survives restarts. Never put real credentials in `.env.example`; this repo is public.
