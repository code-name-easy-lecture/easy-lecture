# How tables get created and updated (proposal)

Status: proposal, not decided. Follows the "Migrations" open item in #54.
Written Nov 16, 2026. Versions and commands were checked against the docs and npm that day.

## The question

Better Auth needs four tables (`user`, `session`, `account`, `verification`). We need at least two of our own (`course`, `lecture`). Something has to create them, change them over time, and do it the same way on a laptop, on Neon for staging and the pilot, and on RDS if we ever move.

The options:

- **(a) Better Auth's CLI on its own.** `npx auth@latest migrate` creates Better Auth's tables. Our own tables are hand-written SQL.
- **(b1) Better Auth + Drizzle.** Better Auth's CLI writes its tables into a Drizzle schema file. Ours go in the same schema. `drizzle-kit` turns the schema into SQL migration files and applies them.
- **(b2) Better Auth + Prisma.** Same idea with a `schema.prisma` file and `prisma migrate`.

## Comparison

| | (a) Better Auth CLI alone | (b1) + Drizzle | (b2) + Prisma |
|---|---|---|---|
| **Setup effort** | Lowest for sign-in: add `pg`, run one command. But it only knows Better Auth's tables | Small: 4 packages, 3 short config files, 3 commands. Done in the proof below | Largest: Prisma 7 needs a config file, a driver adapter and a generated client. npm's default `prisma` is an 8.0 release candidate that Better Auth does not support yet, so versions must be pinned |
| **Our own tables** | No tool. We write SQL files by hand and build our own way to track which ones ran | Same schema file and same migrations as the sign-in tables | Same schema file and same migrations as the sign-in tables |
| **What a PR shows** | Nothing for sign-in tables: `migrate` compares against the live database and applies the difference directly | The schema change and the plain SQL file it produced | The schema change and the plain SQL file it produced |
| **Typed queries** | None. Raw SQL strings | Yes, straight from the schema. No build step | Yes, after a `prisma generate` step that also has to run in CI and on deploy |
| **Neon later** | Works: `pg` connects to Neon like any Postgres | Works: swap one import for Neon's driver (`drizzle-orm/neon-http` or `neon-serverless`). Schema and migrations do not change | Works: add `@prisma/adapter-neon`. Schema and migrations do not change |
| **Serverless later** | Fine. `pg` is small | Good fit. No engine and no generated client, so little to load on a cold start | Heaviest of the three. Better since Prisma 7 dropped its Rust engine, but still a generated client to bundle |
| **What Derek's backend touches** | Raw SQL in every route, plus the home-made migration runner | Imports `db` and the tables, writes typed queries. To change a table: edit the schema, run `drizzle-kit generate`, commit the SQL | Imports the Prisma client. To change a table: edit `schema.prisma`, run `prisma migrate dev`, commit the SQL |
| **What Preston's Python service sees** | The SQL files we wrote | The generated SQL files. Python reads the tables with plain SQL either way | The generated SQL files |
| **Main risk** | We end up building a migration tool | Drizzle's stable line is 0.45. Its 1.0 is still in beta and changes how relations are written. Better Auth already supports both, so this is an upgrade to plan, not a blocker | Version pinning now, and the most moving parts for a three-person team |

## Recommendation: (b1) Better Auth + Drizzle

Option (a) looks cheapest but only solves half the problem. The day we add `course` and `lecture` we need a second mechanism anyway, and we would be writing it ourselves.

Between the two that solve all of it, Drizzle is the lighter one: no generated client, no extra build step, and the Neon switch is one import. Every schema change lands in a PR as a plain SQL file that all three of us can read, including from the Python side.

Prisma is a reasonable second choice. It would win if we wanted its database browser or already knew it. Neither is true today.

## Proof

A throwaway local branch, `spike/drizzle-better-auth`, runs this pick against the Docker database from #75 (Postgres 18.7). It is not for merging. What it showed:

1. `npx auth@latest generate` wrote Better Auth's four tables as a Drizzle schema.
2. `course` and `lecture` were added to the same schema, keyed to Better Auth's `user.id`.
3. `drizzle-kit generate` produced one SQL file for all six tables, and `drizzle-kit migrate` applied it.
4. A script then had Better Auth create a user and a session through the Drizzle adapter, read that user back with Drizzle, inserted a course and a lecture, and ran the join the lecture list needs.
5. A duplicate course name (ignoring case) was rejected by a unique index, and deleting the user removed their sessions, courses and lectures.

Lint and typecheck pass on the branch. It did not test Google sign-in itself, Neon, or a serverless host.

## To decide

1. **Go with Drizzle?** Derek, this is mostly your call, since you will write the queries.
2. **Where the schema lives.** `apps/web/src/lib/db/` is simplest if routes stay Next.js route handlers. If the hosting decision on Nov 19 moves routes to Lambda, it belongs in `packages/shared` so both can import it.
3. **Who runs migrations on staging.** Suggestion: a step in the staging deploy workflow, never by hand.
4. **Ids for our tables.** The proof used UUIDs made by Postgres. Better Auth's own ids are random strings. `docs/api.md` treats all ids as opaque, so either works.
