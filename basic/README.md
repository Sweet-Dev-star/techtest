# Task manager — baseline

The starting point for the full-stack take-home. It implements §01 of the brief and
nothing else: accounts, lists, tasks, filtering, and a database that survives a restart.

**The three problems are not here. That is the assignment.**

## Run it

Node 24 or newer. There are no dependencies to install — the server uses `node:http`,
`node:sqlite` and `node:crypto`, and the tests use `node:test`.

```bash
npm start          # http://127.0.0.1:4000  (migrations run on boot)
npm run dev        # same, restarting on file changes
npm run seed       # demo account + three lists of tasks
npm test           # 31 tests, no server needed for the domain ones
npm run reset      # delete the database and start over
```

After `npm run seed`, sign in with **demo@example.com** / **password123**.

Configuration is environment variables with working defaults — see `.env.example`.
There is no dotenv dependency, so either export them or use `node --env-file=.env`.

## What works

| Area | Included |
| --- | --- |
| Accounts | Register, sign in, sign out. scrypt hashes, HttpOnly session cookie, only the token's SHA-256 is stored |
| Lists | Create, rename, delete, per-list open-task count |
| Tasks | Create, edit, complete, delete, notes, priority, due date |
| Views | Filter by status and due date, search titles, sort by created / due / priority |
| Pagination | Keyset cursors — no OFFSET |
| Storage | SQLite with numbered SQL migrations, applied on boot |
| Client | Framework-free ES modules; replace it with React or anything else if you prefer |

## Layout

```
migrations/          numbered SQL, applied in order and recorded in schema_migrations
src/
  config.js          every environment-dependent value, resolved once
  app.js             builds the request handler: routes → static files → 404
  server.js          entry point; migrates, listens, shuts down cleanly
  domain/            pure logic — no database, no HTTP, instant to test
    errors.js        AppError: the only error type routes throw
    validate.js      validation primitives
    tasks.js         task rules and serialisation
    passwords.js     scrypt hashing
  db/
    connection.js    one SQLite connection, WAL, foreign keys on
    migrate.js       the migration runner
    repositories/    all SQL lives here, one file per table
      access.js      THE authorisation seam — read this one first
  http/
    router.js        ~60-line router, 405 when the path exists but the method does not
    middleware.js    JSON bodies, cookies, sessions
    respond.js       the only place an error becomes a response
    static.js        serves public/, with traversal blocked
    routes/          auth, lists, tasks
public/              the web client (index.html, app.css, js/)
tests/               domain.test.js (pure) and api.test.js (real HTTP)
```

Two rules keep it navigable, and they are worth keeping: **all SQL lives in
`db/repositories/`**, and **`domain/` imports nothing from `http/` or `db/`**.

## The API

Everything except `/auth/*` requires a session cookie.

| Method | Path | Notes |
| --- | --- | --- |
| `POST` | `/auth/register` | `{ email, password, display_name? }` — 409 if taken |
| `POST` | `/auth/login` | Same 401 for a wrong password and an unknown user |
| `POST` | `/auth/logout` | 204 |
| `GET` | `/auth/me` | `{ user: null }` when signed out |
| `GET` | `/lists` | With `open_count` per list |
| `POST` | `/lists` | `{ name }` |
| `PATCH` | `/lists/:id` | `{ name }` |
| `DELETE` | `/lists/:id` | Cascades to its tasks |
| `GET` | `/lists/:id/tasks` | `?status=&due_before=&q=&sort=&cursor=&limit=` |
| `POST` | `/tasks` | `{ list_id, title, notes?, priority?, due_at? }` |
| `PATCH` | `/tasks/:id` | Only the fields you send change |
| `DELETE` | `/tasks/:id` | 204 |

Errors are `{ "error": { "code", "message" } }`. A resource you may not see returns
**404, not 403** — the API does not confirm that other people's data exists.

## Where the three problems attach

Nothing below is written for you. These are the seams the baseline was shaped around.

**Problem 1 — repeating tasks and sub-tasks.** `tasks.parent_id` exists, is indexed and
is never set. A recurrence rule belongs in `src/domain/` beside `tasks.js`, because it is
pure logic and should be testable without a database. `queryTasks` in
`db/repositories/tasks.js` is where a `from`/`to` window expands. Note that
`domain/validate.js:optionalTimestamp` stores a due date as a fixed instant — the simple
reading, and the wrong one once a task repeats at 09:00 local across a DST boundary.

**Problem 2 — offline editing and conflicts.** `public/js/store.js` is ten lines and
re-renders everything on every change: fine for fifty tasks, openly wrong for five
thousand. There is no version column on `tasks` yet, so `PATCH /tasks/:id` is
last-write-wins — see the comment in `http/routes/tasks.js` where a 409 belongs. IDs are
UUIDs generated server-side; moving that to the client is one way to make replay
idempotent.

**Problem 3 — sharing, roles and audit.** `db/repositories/access.js` is the single place
that decides whether a user may touch a list or a task, and every route goes through it.
Adding membership and roles should be a change to that file plus a role argument at its
call sites — not an audit of every handler. `deleteSessionsForUser` is already there for
"sign out everywhere".

## Deliberately not included

Not oversights — decisions, so you can spend your hours on the problems:

- **No tags.** The brief lists them as optional; add the table if you want them.
- **No rate limiting** on login or invites. Problem 3 asks for it.
- **No CSRF token.** The session cookie is `SameSite=Lax`, which covers the obvious case
  but is not a complete answer.
- **No refresh tokens.** One session cookie with a 14-day expiry.
- **No soft delete.** Deletes are permanent and cascade.
- **Minimal client.** Enough to exercise every endpoint, and no more.

If you change any of these, say so in your `DECISIONS.md` — the reasoning is what gets
read.
