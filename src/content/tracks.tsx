import type { ReactNode } from "react";
import { problems as fullStackProblems, type Problem } from "@/content/assessment";
import { DEVELOPER_TYPES, type DeveloperType } from "@/lib/options";

/* ------------------------------------------------------------------
   One track per role, all built on the same starter.

   The rules do not change between tracks: eight hours, hand-written,
   one problem finished properly beats three half-built. Only the
   problems change, so a candidate is judged on the work they would
   actually be hired to do.
   ------------------------------------------------------------------ */

export type Track = {
  role: DeveloperType;
  label: string;
  /** One line, used on the index card. */
  focus: string;
  lede: string;
  problems: Problem[];
};

/* --------------------------------- Front End --------------------------------- */

const frontEnd: Problem[] = [
  {
    id: "fe-1",
    tag: "Problem 1 · Client state & sync",
    meta: "weight 35% · hard",
    title: "Working offline, and merging back",
    intro: [
      <>
        Someone opens the app on the underground. They tick four tasks, rename a list, add
        two more, and close the laptop. Twenty minutes later the network returns — while in
        the meantime they edited one of those same tasks on their phone. Nothing should be
        lost, nothing duplicated, and they should never have to wonder which version won.
      </>,
    ],
    requirements: [
      <>Create, edit, complete and delete keep working with the network off, once the app has loaded.</>,
      <>
        Every change is queued durably and replayed in order on reconnect. Closing the tab
        does not drop the queue.
      </>,
      <>
        Replay is <b>idempotent</b>: a retried request never creates a second task.
      </>,
      <>
        Writes carry a version, and a stale write comes back <code>409</code> rather than
        overwriting. You will need to add that column — the starter is last-write-wins today.
      </>,
      <>Each row shows its own state: pending, synced, failed. Failed is retryable.</>,
    ],
    readFor: [
      <>Who owns the truth — server cache, local store, or an unhappy mixture of both</>,
      <>Rollback on failure: does the UI actually return to a correct state?</>,
      <>Whether the sync layer is testable without a browser</>,
    ],
    doneWhen: [
      <>An airplane-mode walkthrough in the README that we can repeat</>,
      <>A test forces a 409 and asserts the resolution</>,
      <>Killing the tab mid-queue loses nothing</>,
    ],
  },
  {
    id: "fe-2",
    tag: "Problem 2 · Rendering at size",
    meta: "weight 35% · medium",
    title: "Five thousand tasks that still feel instant",
    intro: [
      <>
        Run <code>npm run seed -- --tasks 5000</code> and the list becomes unusable. The
        starter re-renders everything on every keystroke, which is honest and completely
        wrong at this size. Typing in the filter box should feel immediate at 5,000 rows and
        stay that way at 50,000.
      </>,
    ],
    requirements: [
      <>Filtering, sorting and scrolling stay smooth with 5,000 tasks in one list.</>,
      <>
        Typing in the search box does not fire a request per keystroke, and the results that
        arrive out of order never overwrite newer ones.
      </>,
      <>
        Only what is on screen is in the DOM, or you can show us why it does not need to be.
      </>,
      <>Toggling one task does not re-render the other 4,999.</>,
      <>Keyboard scrolling, focus and browser find still behave sensibly.</>,
    ],
    readFor: [
      <>Whether you measured before optimising, and what you measured with</>,
      <>Where memoisation earns its keep and where it is cargo cult</>,
      <>The trade you took on virtualisation versus pagination, and its cost</>,
    ],
    doneWhen: [
      <>A before/after measurement in the README, with the method stated</>,
      <>Interaction stays responsive while a page of results is loading</>,
      <>No layout jump when rows enter or leave</>,
    ],
  },
  {
    id: "fe-3",
    tag: "Problem 3 · Accessibility & interaction",
    meta: "weight 30% · medium",
    title: "Usable without a mouse, and without sight",
    intro: [
      <>
        The starter&rsquo;s inline rename is a click handler and nothing else: no keyboard
        path, no focus management, no announcement. Make the whole app work for someone
        driving it from the keyboard and someone hearing it through a screen reader — not by
        sprinkling ARIA, but by getting the semantics and focus right.
      </>,
    ],
    requirements: [
      <>Every action is reachable and operable by keyboard alone, in a sensible order.</>,
      <>
        Renaming, deleting and completing manage focus deliberately — focus never lands on
        nothing after a row disappears.
      </>,
      <>Status changes and errors are announced, not just shown.</>,
      <>
        Deleting a list is destructive and irreversible; make that safe without a
        <code> confirm()</code> dialog.
      </>,
      <>Colour is never the only carrier of meaning, and contrast holds up.</>,
    ],
    readFor: [
      <>Native elements used before ARIA is reached for</>,
      <>Focus traps, focus loss, and what happens after an async action</>,
      <>Whether the empty, loading and error states were designed or defaulted</>,
    ],
    doneWhen: [
      <>You can complete every flow without touching the mouse</>,
      <>An automated accessibility check runs in your test suite</>,
      <>A short note on what you tested with, and what you know is still weak</>,
    ],
  },
];

/* --------------------------------- Back End ---------------------------------- */

const backEnd: Problem[] = [
  {
    id: "be-1",
    tag: "Problem 1 · Domain modelling & API",
    meta: "weight 35% · hard",
    title: "Repeating tasks and sub-tasks",
    intro: [
      <>
        A task can repeat: every day, every weekday, every second Tuesday, the 30th of each
        month. It ends never, after <em>n</em> occurrences, or on a date. A task can also
        have sub-tasks, up to three levels deep. Completing Tuesday&rsquo;s instance must not
        complete the series, and editing one has to ask <em>this occurrence</em> or{" "}
        <em>this and everything after</em>.
      </>,
    ],
    requirements: [
      <>A recurrence is stored as a <b>rule</b>, not as ten thousand pre-generated rows.</>,
      <>
        <code>{"GET /tasks?from=&to="}</code> expands the occurrences in a window on read,
        with exceptions applied.
      </>,
      <>
        Due times are wall-clock local to the user: 09:00 daily stays 09:00 across a DST
        boundary. The 31st in a 30-day month has a defined, documented answer.
      </>,
      <>Sub-tasks roll up: a parent shows progress from its children.</>,
      <>Loading 200 parents with their children issues a bounded number of queries.</>,
    ],
    readFor: [
      <>Whether the rule engine is its own testable unit or smeared across controllers</>,
      <>Timezone handling — the starter stores a fixed instant, which is the wrong reading</>,
      <>Where the tree lives, and whether you can say why</>,
    ],
    doneWhen: [
      <>Tests cover DST, month-end, and &ldquo;this and future&rdquo; edits</>,
      <>A one-year window expands in well under a second</>,
      <>The rule engine runs without a database</>,
    ],
  },
  {
    id: "be-2",
    tag: "Problem 2 · Data & query design",
    meta: "weight 35% · medium",
    title: "Search and pagination that survive a million rows",
    intro: [
      <>
        Seed five thousand tasks, then imagine a million. The starter&rsquo;s title search is
        a <code>LIKE &apos;%term%&apos;</code>, which cannot use an index, and its keyset
        cursor is correct but untested at size. Make the read path hold up, and prove it with
        query plans rather than opinion.
      </>,
    ],
    requirements: [
      <>
        Full-text search on title and notes, ranked, using something better than a leading
        wildcard.
      </>,
      <>
        Cursor pagination stays stable when rows are inserted or deleted mid-scroll: no
        duplicates, no silently skipped rows.
      </>,
      <>Every supported sort is backed by an index, and you can show the plan that proves it.</>,
      <>A counts-and-facets endpoint that does not scan the table per filter.</>,
      <>A seed or benchmark script we can run to reproduce your numbers.</>,
    ],
    readFor: [
      <>
        <code>EXPLAIN QUERY PLAN</code> output in your notes, not just assertions
      </>,
      <>Whether the index set matches the queries, or is hopeful</>,
      <>How you handled ties in the sort key — that is where cursors usually break</>,
    ],
    doneWhen: [
      <>A test inserts rows between pages and asserts nothing is skipped or repeated</>,
      <>Measured timings at 5,000 and at a larger size, with the method stated</>,
      <>Search is case- and accent-insensitive, or documented as not</>,
    ],
  },
  {
    id: "be-3",
    tag: "Problem 3 · Concurrency & correctness",
    meta: "weight 30% · hard",
    title: "Two writers, one task",
    intro: [
      <>
        <code>PATCH /tasks/:id</code> is last-write-wins: two clients editing the same task
        silently lose one edit. Bulk operations have no transaction boundary at all. Make
        concurrent writes safe, and make retries harmless.
      </>,
    ],
    requirements: [
      <>
        Optimistic concurrency on task updates: a stale write is rejected with{" "}
        <code>409</code> and enough detail to resolve it.
      </>,
      <>
        A bulk endpoint — complete or move many tasks at once — that is atomic. Partial
        application is not an acceptable outcome.
      </>,
      <>
        Retried requests are idempotent, via client-supplied keys or another mechanism you
        can defend.
      </>,
      <>Reordering tasks within a list is safe under concurrent edits.</>,
      <>A test that runs writers in parallel and asserts no lost update.</>,
    ],
    readFor: [
      <>Where the transaction boundaries are, and whether they wrap the whole unit of work</>,
      <>Version column, timestamp or ETag — and whether you know why yours is enough</>,
      <>What happens under SQLite&rsquo;s locking model, and what you would change on Postgres</>,
    ],
    doneWhen: [
      <>A concurrency test fails against the starter and passes against your version</>,
      <>Every multi-row write is inside one transaction</>,
      <>The 409 response tells a client how to recover</>,
    ],
  },
];

/* ----------------------------------- DevOps ---------------------------------- */

const devops: Problem[] = [
  {
    id: "ops-1",
    tag: "Problem 1 · Environments",
    meta: "weight 35% · medium",
    title: "One command, any machine",
    intro: [
      <>
        The starter runs with <code>npm start</code> because it has no dependencies and a
        file for a database. That will not survive contact with a second engineer, a CI
        runner, or production. Make the environment reproducible and the image something you
        would actually deploy.
      </>,
    ],
    requirements: [
      <>
        A multi-stage <code>Dockerfile</code> producing a small image that runs as a
        non-root user.
      </>,
      <>
        <code>docker compose up</code> gives a working app and database with one command,
        from a clean clone.
      </>,
      <>Configuration comes from the environment, and the image is built once and promoted.</>,
      <>A real healthcheck that fails when the database is unreachable, not just when the port is open.</>,
      <>
        Data survives a container restart, and you have a documented answer for where it
        lives in production.
      </>,
    ],
    readFor: [
      <>Image size and layer caching, and whether the build is reproducible</>,
      <>Secrets handling — nothing baked into a layer</>,
      <>Whether the SQLite-on-a-volume decision was made or inherited</>,
    ],
    doneWhen: [
      <>A clean clone reaches a working app with one command</>,
      <>The container stops cleanly on SIGTERM without dropping in-flight requests</>,
      <>Your README states the image size and the base you chose, with a reason</>,
    ],
  },
  {
    id: "ops-2",
    tag: "Problem 2 · Pipeline & release",
    meta: "weight 35% · medium",
    title: "A pipeline that can say no",
    intro: [
      <>
        There is no CI. Build one that blocks a bad change rather than reporting it
        afterwards, and give the app a migration and release story that does not require
        downtime or courage.
      </>,
    ],
    requirements: [
      <>
        Lint, typecheck where relevant, and the full test suite run on every pull request,
        with the pipeline failing the build.
      </>,
      <>Migrations run as part of deployment, and a failed migration does not leave a broken app.</>,
      <>
        An expand/contract example: add a non-null column to <code>tasks</code> without
        downtime, in the right number of steps.
      </>,
      <>A documented, tested rollback — including what happens to a migration you cannot undo.</>,
      <>The pipeline caches sensibly and finishes fast enough that people wait for it.</>,
    ],
    readFor: [
      <>Whether the pipeline actually blocks, or just reports</>,
      <>How you separated migrate from deploy, and why</>,
      <>Pinned versions and a lockfile, or drift waiting to happen</>,
    ],
    doneWhen: [
      <>A deliberately broken commit is rejected by CI, and you show us the run</>,
      <>The rollback procedure has been executed, not just written</>,
      <>Total pipeline time is stated</>,
    ],
  },
  {
    id: "ops-3",
    tag: "Problem 3 · Operability",
    meta: "weight 30% · medium",
    title: "The 3am question: what is it doing?",
    intro: [
      <>
        The starter logs almost nothing. When it is slow at 3am, nobody can answer why. Make
        it observable enough that the next person on call can diagnose a problem from the
        outside, and prove the backup works by restoring from it.
      </>,
    ],
    requirements: [
      <>
        Structured logs with a request id that follows a request through every layer, and no
        secrets or passwords in them.
      </>,
      <>
        <code>/health</code> and <code>/ready</code> that mean different things, and mean them
        correctly.
      </>,
      <>Request rate, error rate and latency exposed in a form a monitoring system can scrape.</>,
      <>
        A backup that runs on a schedule and a <b>restore you have actually performed</b>,
        with the tests passing afterwards.
      </>,
      <>One alert worth waking someone for, with the reasoning for the threshold.</>,
    ],
    readFor: [
      <>Whether the logs answer a question you would really ask</>,
      <>Cardinality in your metrics — labels that would melt a time-series database</>,
      <>An untested backup is not a backup; we will look for evidence of the restore</>,
    ],
    doneWhen: [
      <>A restore drill is documented with its output</>,
      <>You can trace one request end to end from the logs</>,
      <>The alert has a stated threshold and a stated reason</>,
    ],
  },
];

/* ------------------------------------- QA ------------------------------------ */

const qa: Problem[] = [
  {
    id: "qa-1",
    tag: "Problem 1 · Strategy",
    meta: "weight 30% · medium",
    title: "Audit the 35 tests you were given",
    intro: [
      <>
        The starter ships 35 passing tests. Passing tests are not the same as tested
        software. Work out what they actually cover, what they miss, and what a suite for
        this app should look like — then build the layer that is missing.
      </>,
    ],
    requirements: [
      <>
        A written audit: what each layer covers today, what it does not, and what risk that
        leaves.
      </>,
      <>A stated strategy — what belongs in unit, integration and end-to-end, and why here.</>,
      <>The missing layer, implemented, not just proposed.</>,
      <>
        Coverage reported and <b>interpreted</b>: name a number that is high and a risk it
        conceals.
      </>,
      <>Tests readable by someone who did not write them, with intent obvious from the name.</>,
    ],
    readFor: [
      <>Whether you tested behaviour or implementation</>,
      <>Judgement about what is not worth testing</>,
      <>Whether the audit found the things we know are weak</>,
    ],
    doneWhen: [
      <>The audit names at least three real gaps</>,
      <>New tests fail if the behaviour they describe regresses</>,
      <>The whole suite runs from a clean clone with one command</>,
    ],
  },
  {
    id: "qa-2",
    tag: "Problem 2 · Finding defects",
    meta: "weight 40% · hard",
    title: "Break it on purpose",
    intro: [
      <>
        There are genuine defects and undefined behaviours in the starter — some documented,
        some not. Find them, prove each one with a failing test before you touch the code,
        then decide which to fix and which to write up.
      </>,
    ],
    requirements: [
      <>
        Each defect gets a report: what you expected, what happened, how to reproduce it, and
        how bad it is.
      </>,
      <>A failing test that demonstrates the defect, committed <b>before</b> the fix.</>,
      <>
        At least one defect found at a boundary — concurrency, timezones, pagination edges,
        or input that is legal but hostile.
      </>,
      <>A judgement call: something you found, chose not to fix, and justified.</>,
      <>No false positives. A report we cannot reproduce counts against you.</>,
    ],
    readFor: [
      <>Where you went looking, and whether it was where the risk actually is</>,
      <>Reproduction steps precise enough to follow without asking you</>,
      <>Severity assessed against users, not against your effort</>,
    ],
    doneWhen: [
      <>Every report reproduces on our machine from your steps</>,
      <>Commit history shows failing test, then fix</>,
      <>The write-up separates a defect from a design decision you disagree with</>,
    ],
  },
  {
    id: "qa-3",
    tag: "Problem 3 · Automation you can trust",
    meta: "weight 30% · medium",
    title: "A suite that never cries wolf",
    intro: [
      <>
        A flaky suite is worse than no suite, because people learn to ignore it. Build
        end-to-end coverage of the critical paths that is deterministic, fast, and runs
        unattended in CI.
      </>,
    ],
    requirements: [
      <>
        End-to-end coverage of the paths that matter: register, sign in, create, complete,
        filter, paginate.
      </>,
      <>
        Deterministic data — every test sets up and tears down its own state and can run in
        any order.
      </>,
      <>Safe in parallel, with no shared-database collisions.</>,
      <>
        No arbitrary sleeps. Waiting is on a condition, and a failure explains itself without
        a rerun.
      </>,
      <>Runs in CI on every push, with failures readable from the log alone.</>,
    ],
    readFor: [
      <>Selector strategy, and how much a UI tweak would cost you</>,
      <>Whether a failure tells you what broke or only that something did</>,
      <>Total runtime, and whether anyone would actually wait for it</>,
    ],
    doneWhen: [
      <>The suite passes ten times in a row, and you show us</>,
      <>Tests pass in a randomised order</>,
      <>A seeded failure produces a diagnosable report</>,
    ],
  },
];

/* ------------------------------------------------------------------ */

const PROBLEMS: Record<DeveloperType, Problem[]> = {
  frontend: frontEnd,
  backend: backEnd,
  fullstack: fullStackProblems,
  devops,
  qa,
};

const FOCUS: Record<DeveloperType, { focus: string; lede: string }> = {
  frontend: {
    focus: "Offline sync, rendering at size, accessibility",
    lede: "Three places where the starter's client falls over: a network that comes and goes, a list that outgrows naive rendering, and an interface that assumes a mouse and a pair of eyes.",
  },
  backend: {
    focus: "Domain modelling, query design, concurrency",
    lede: "Three places where the starter's server is too simple to survive: a calendar problem, a read path that cannot scale, and writes that quietly lose each other.",
  },
  fullstack: {
    focus: "Recurrence, offline conflicts, access control",
    lede: "One problem in each layer, chosen so a weak answer in the middle shows up at both ends: the domain, the client, and the seam that guards them.",
  },
  devops: {
    focus: "Environments, pipeline, operability",
    lede: "The starter has no image, no pipeline and no way to answer what it is doing at 3am. Three problems about making it someone else's problem safely.",
  },
  qa: {
    focus: "Strategy, defect hunting, reliable automation",
    lede: "The starter ships 35 passing tests, which is not the same as tested software. Three problems about knowing the difference and proving it.",
  },
};

export const TRACKS: Track[] = DEVELOPER_TYPES.map((type) => ({
  role: type.value,
  label: type.label,
  focus: FOCUS[type.value].focus,
  lede: FOCUS[type.value].lede,
  problems: PROBLEMS[type.value],
}));

export function trackFor(role: string): Track | undefined {
  return TRACKS.find((track) => track.role === role);
}

export const tracksIndexLede: ReactNode = (
  <>
    Five tracks, one starter. The rules are the same in all of them &mdash; eight hours,
    hand-written, one problem finished properly beats three half-built. Only the problems
    change, so you are judged on the work you would actually be hired to do. Register with
    your role and we send you the matching track.
  </>
);
