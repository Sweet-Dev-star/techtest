-- Baseline schema: accounts, sessions, lists, tasks.
--
-- Two of the problems push directly on this schema. parent_id and recurrence
-- are yours to design; there is deliberately no version column on tasks, which
-- is why PATCH is last-write-wins today.

CREATE TABLE users (
  id               TEXT PRIMARY KEY,
  username         TEXT NOT NULL,
  username_lower   TEXT NOT NULL UNIQUE,
  email            TEXT NOT NULL,
  -- Lower-cased copy so uniqueness is case-insensitive without a custom collation.
  email_lower      TEXT NOT NULL UNIQUE,
  password_hash    TEXT NOT NULL,
  created_at       TEXT NOT NULL
);

-- Only the SHA-256 of a session token is stored, so a leaked database does not
-- hand out live sessions.
CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE INDEX idx_sessions_user ON sessions(user_id);

CREATE TABLE lists (
  id         TEXT PRIMARY KEY,
  owner_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  position   INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE INDEX idx_lists_owner ON lists(owner_id, position, created_at);

CREATE TABLE tasks (
  id           TEXT PRIMARY KEY,
  list_id      TEXT NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  -- Present and indexed, but the baseline never sets it. Recurrence and
  -- sub-tasks give parent_id meaning.
  parent_id    TEXT REFERENCES tasks(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  notes        TEXT,
  priority     INTEGER NOT NULL DEFAULT 2,   -- 1 low, 2 normal, 3 high
  -- No CHECK on status on purpose: SQLite cannot alter one, so a CHECK would
  -- force a table rebuild the first time you add a value like 'skipped'.
  status       TEXT NOT NULL DEFAULT 'open',
  due_at       TEXT,                          -- ISO 8601, UTC
  completed_at TEXT,
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL
);

-- One index per supported sort, so keyset pagination stays on an index as the
-- table grows. Add a matching index when you add a sort.
CREATE INDEX idx_tasks_list_created  ON tasks(list_id, created_at DESC, id DESC);
CREATE INDEX idx_tasks_list_due      ON tasks(list_id, due_at, id);
CREATE INDEX idx_tasks_list_priority ON tasks(list_id, priority DESC, id DESC);
CREATE INDEX idx_tasks_parent        ON tasks(parent_id);
