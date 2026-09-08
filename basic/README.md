# Task manager — starter

The starting point for the full-stack take-home: a React client and an Express
API, with accounts, lists, tasks, filtering, search and a database that survives
a restart. **The problems are not here. That is the assignment.**

The five role tracks — Front End, Back End, Full Stack, DevOps, QA — all build on
this one project. Each attacks it where it is deliberately thin.

## Stack

- **Client** — React 18 + Vite + TypeScript, a plain functional to-do UI.
- **Server** — Express + TypeScript, SQLite via better-sqlite3, Zod for validation.
- **Monorepo** — npm workspaces (`server`, `client`); one `npm install` at the root.

## Run it

Node 20 or newer.

```bash
npm install
npm run dev        # API on :4000, client on :5173 (proxied), both watching
npm run seed       # demo@example.com / password123
npm test           # 35 server + 3 client tests
```

Open http://localhost:5173. For a production-style single origin:

```bash
npm run build      # client → client/dist, server → server/dist
npm start          # serves the built client and the API from one port (:4000)
```

Other scripts: `npm run seed -- --tasks 5000` (adds a 5,000-task list to see it at
size), `npm run reset` (delete the database), `npm run typecheck`, `npm run migrate`.

Configuration is environment variables with working defaults — see `.env.example`.

## Layout

```
basic/
  package.json            workspaces root; dev/build/test/seed scripts
  server/
    src/
      config.ts           every environment-dependent value, resolved once
      app.ts              the Express app factory (routes → static client → 404)
      index.ts            entry point: migrate, listen, shut down cleanly
      db/
        connection.ts     one better-sqlite3 connection, WAL, foreign keys on
        migrate.ts        the migration runner
        migrations/       numbered SQL, applied on boot
      domain/             pure logic — no database, no HTTP, instant to test
        errors.ts         AppError: the only error type routes throw
        schemas.ts        Zod request shapes; .strict() is the mass-assignment guard
        passwords.ts      scrypt hashing
        tasks.ts          task rules and serialisation
      repositories/       all SQL, one file per table
        access.ts         THE authorisation seam — read this one first
      middleware/         request context, auth, error handling
      routes/             auth, lists, tasks, health
    scripts/              seed.ts, reset.ts
    tests/                domain + integration (supertest), fresh in-memory db each file
  client/
    src/
      api/client.ts       the only module that talks to the server
      state/store.ts      ~20-line store; re-renders everything on every change
      state/app.ts        the app's state and actions
      features/           AuthPanel, ListsPanel, TasksPanel
```

Two rules keep the server navigable and are worth keeping: **all SQL lives in
`repositories/`**, and **`domain/` imports nothing from `routes/` or `db/`**.

## The API

Everything except `/api/auth/*` and `/api/health` needs a session cookie. Errors
are `{ "error": { "code", "message", "details"? } }`. A resource you may not see
returns **404, not 403** — the API never confirms that other people's data exists.

| Method | Path | Notes |
| --- | --- | --- |
| `POST` | `/api/auth/register` | `{ username, email, password }` — 409 if taken |
| `POST` | `/api/auth/login` | `{ identifier, password }` — email or username |
| `POST` | `/api/auth/logout` | 204 |
| `GET` | `/api/auth/me` | `{ user: null }` when signed out |
| `GET` | `/api/lists` | With an open-task count per list |
| `POST` | `/api/lists` | `{ name }` |
| `PATCH` | `/api/lists/:id` | `{ name }` |
| `DELETE` | `/api/lists/:id` | Cascades to its tasks |
| `GET` | `/api/lists/:id/tasks` | `?status=&due_before=&q=&sort=&cursor=&limit=` |
| `POST` | `/api/tasks` | `{ list_id, title, notes?, priority?, due_at? }` |
| `PATCH` | `/api/tasks/:id` | Only the fields you send change |
| `DELETE` | `/api/tasks/:id` | 204 |
| `GET` | `/api/health` | Liveness only — does not check the database |

## What the starter deliberately does not do

Not oversights — these are the seams each track attaches to. Leaving them is the
point; filling them is the work.

- **No version column on `tasks`**, so `PATCH` is last-write-wins: two clients
  editing one task silently lose an edit. *(offline, concurrency)*
- **`parent_id` exists, is indexed, and is never set.** *(recurrence, sub-tasks)*
- **Title search is `LIKE '%term%'`**, which cannot use an index. *(query design)*
- **The client re-renders everything on every change** and holds every row in the
  DOM — fine at fifty rows, unusable at five thousand. *(rendering at size)*
- **Inline rename is a click handler only** — no keyboard path, no focus
  management, and delete uses `confirm()`. *(accessibility)*
- **No Dockerfile, no compose, no CI, minimal logging**, and `/api/health` does not
  check the database. *(environments, pipeline, operability)*
- **No rate limiting, no CSRF token** beyond a `SameSite=Lax` cookie.
- **No sharing, roles or audit** — a list has a single owner. *(access control)*

Change any of these and say why in a `DECISIONS.md`. The reasoning is what gets read.

## Swapping the database

better-sqlite3 is synchronous and file-backed, which keeps the code simple. Moving
to Postgres means reimplementing `db/connection.ts` and the `repositories/`; nothing
above them constructs SQL. That boundary is deliberate.
