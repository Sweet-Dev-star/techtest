import type { ReactNode } from "react";
import { site } from "@/config/site";
import { nodes } from "@/lib/nodes";

/* ------------------------------------------------------------------
   All candidate-facing copy lives here. Edit this file to change the
   brief; the components never hard-code sentences.
   Rich text is written as JSX, so <b> and <code> are type-checked
   rather than injected as raw HTML.
   ------------------------------------------------------------------ */

export const headline = "Build a task manager. Then solve three problems inside it.";

export const deck: ReactNode = (
  <>
    The base app is deliberately boring — lists, tasks, done or not done. We ship it
    working, so you don&rsquo;t spend the clock on scaffolding. What we actually read is
    the{" "}
    <b>three problems buried in it</b>: recurrence and hierarchy, offline editing and
    conflicts, shared access and permissions. Each one is a place where a real product
    quietly gets hard.
  </>
);

export const specStrip: { term: string; value: string; note: string }[] = [
  { term: "Time limit", value: site.effort, note: "from receipt — hard stop" },
  { term: "Starting point", value: "Baseline provided", note: `${site.starterRuntime} · port allowed` },
  { term: "Code", value: "Hand-written", note: "see rule 0" },
  { term: "Submission", value: "GitHub repository", note: "link by email" },
];

/* ---------------------------------- §01 --------------------------------- */

export const baseProject = {
  lede:
    "You do not build this part — we ship it. Clone the starter, run it, read it, then build the three problems on top. It exists so that nobody spends the clock on login forms, and so that every submission we read starts from the same floor. Nothing in it scores on its own.",

  runNote: (
    <>
      {site.starterRuntime}, and nothing to install: the starter has zero dependencies and
      uses <code>node:http</code>, <code>node:sqlite</code>, <code>node:crypto</code> and{" "}
      <code>node:test</code>. If <code>npm start</code> does not work on a clean clone,
      tell us — that is our bug, not yours. Nothing stops you cloning and running it
      before your clock starts; getting a database up is not what we are testing.
    </>
  ),

  run: [
    `git clone ${site.starterRepo}`,
    `cd ${site.starterDir.replace("/", "")}`,
    "npm start        # http://127.0.0.1:4000",
    "npm run seed     # demo@example.com / password123",
    "npm test         # 31 tests, all green",
  ].join("\n"),

  included: [
    <>
      <b>Accounts.</b> Register, sign in, sign out. scrypt password hashes, an HttpOnly
      session cookie, and only the token&rsquo;s SHA-256 stored.
    </>,
    <>
      <b>Lists and tasks.</b> Full CRUD, notes, priority, due dates, and a live count of
      unfinished tasks per list.
    </>,
    <>
      <b>Views.</b> Filter by status and due date, search titles, sort by created, due or
      priority — with keyset cursors rather than <code>OFFSET</code>.
    </>,
    <>
      <b>Storage.</b> SQLite with numbered SQL migrations, applied on boot.
    </>,
    <>
      <b>Isolation.</b> One user cannot read or touch another&rsquo;s data, and there is a
      test proving it.
    </>,
    <>
      <b>A web client.</b> Framework-free ES modules, no build step. Replace it with React
      or anything else if you prefer.
    </>,
  ] satisfies ReactNode[],

  omitted: [
    <>
      <b>No version column on tasks</b>, so <code>PATCH</code> is last-write-wins today.
      Problem 2 changes that.
    </>,
    <>
      <b><code>parent_id</code> exists, is indexed, and is never set.</b> Problem 1 gives it
      meaning.
    </>,
    <>
      <b>No rate limiting, no CSRF token</b> beyond a <code>SameSite=Lax</code> cookie.
      Problem 3&rsquo;s territory.
    </>,
    <>
      <b>The client re-renders everything on every change.</b> Honest rather than
      half-optimised; performance is not scored, but the sync state you add in Problem 2
      has to live somewhere in it.
    </>,
    <>
      <b>No tags, no soft delete.</b> Add them if you want them; say why in{" "}
      <code>DECISIONS.md</code>.
    </>,
  ] satisfies ReactNode[],

  schemaNote: (
    <>
      What the starter creates in <code>migrations/001_initial.sql</code>. Extend it by
      adding a numbered migration — never by editing one that has already been applied,
      the way you would treat a database you cannot drop. Two of the three problems push
      directly on this schema.
    </>
  ),

  schema: [
    {
      table: "users",
      columns: "id · email · password_hash · display_name · created_at",
      notes: <>Email unique, case-insensitive.</>,
    },
    {
      table: "lists",
      columns: "id · owner_id · name · position · created_at",
      notes: <>Owner is a user. Sharing arrives in Problem 3.</>,
    },
    {
      table: "tasks",
      columns:
        "id · list_id · parent_id · title · notes · priority · status · due_at · completed_at · created_at · updated_at",
      notes: (
        <>
          <code>parent_id</code> and recurrence are Problem 1.
        </>
      ),
    },
    {
      table: "sessions",
      columns: "token_hash · user_id · created_at · expires_at",
      notes: <>Only the hash. A leaked database hands out no live sessions.</>,
    },
  ],

  endpoints: [
    {
      method: "POST",
      path: "/auth/register · /auth/login · /auth/logout",
      does: <>Session or token — your call, defend it.</>,
    },
    { method: "GET", path: "/auth/me", does: <>{`{ user: null }`} when signed out.</> },
    { method: "GET", path: "/lists", does: <>With an open-task count per list.</> },
    { method: "POST", path: "/lists", does: <>Create a list.</> },
    {
      method: "GET",
      path: "/lists/:id/tasks?status=&due_before=&q=&cursor=",
      does: <>Paginated. Cursor, not offset, please.</>,
    },
    { method: "POST", path: "/tasks", does: <>Create a task.</> },
    { method: "PATCH", path: "/tasks/:id", does: <>Partial update, including completion.</> },
    {
      method: "DELETE",
      path: "/tasks/:id",
      does: <>Hard delete. Make it a soft delete if you can justify it.</>,
    },
  ],

  apiNote: (
    <>
      Errors come back as <code>{`{ error: { code, message } }`}</code>. A resource you may
      not see returns <b>404, not 403</b> — the API never confirms that other
      people&rsquo;s data exists. Keep that property as you extend it.
    </>
  ),

  repoNote:
    "What you clone. The annotations mark where each problem attaches — the starter's own README goes into more detail on each seam.",
};

/* ---------------------------------- §02 --------------------------------- */

export type Problem = {
  id: string;
  tag: string;
  meta: string;
  title: string;
  intro: ReactNode[];
  requirements: ReactNode[];
  readFor: ReactNode[];
  doneWhen: ReactNode[];
};

export const problemsLede =
  "Each sits in a different layer of the stack, and each has an obvious shortcut that falls apart under a second look. Eight hours is not enough for all three, and we do not expect all three — read them, pick where you are strongest, and go deep. One problem finished properly tells us far more than three sketches. They share the same data, so Problem 1 is the natural place to start.";

export const problems: Problem[] = [
  {
    id: "problem-1",
    tag: "Problem 1 · Domain modelling & API",
    meta: "weight 35% · server-heavy",
    title: "Repeating tasks and sub-tasks",
    intro: [
      <>
        A task can repeat: every day, every weekday, every second Tuesday, the 30th of each
        month. It ends never, after <em>n</em> occurrences, or on a date. A task can also
        have sub-tasks, up to three levels deep.
      </>,
      <>
        The two features collide. Completing Tuesday&rsquo;s instance must not complete the
        series, and must not silently rewrite next Tuesday. Editing a repeating task has to
        ask <em>this one</em> or <em>this and everything after</em> — and both answers need
        to survive the user changing timezone on a flight.
      </>,
    ],
    requirements: [
      <>
        A recurrence is stored as a <b>rule</b>, not as ten thousand pre-generated rows.
      </>,
      <>
        <code>{"GET /tasks?from=&to="}</code> returns the occurrences inside a window,
        expanded on read, with exceptions applied.
      </>,
      <>
        Completing, skipping or editing one occurrence creates an <b>exception</b> that
        survives later edits to the series.
      </>,
      <>
        Due times are wall-clock local to the user: 09:00 daily stays 09:00 across a DST
        boundary. The 31st in a 30-day month has a defined answer — pick one, document it.
      </>,
      <>
        Sub-tasks roll up: a parent shows progress from its children, and deleting a parent
        has a stated, tested behaviour.
      </>,
      <>
        Loading 200 parents with their children issues a bounded number of queries. We will
        count them.
      </>,
    ],
    readFor: [
      <>Whether the recurrence rule is its own testable unit or smeared across controllers</>,
      <>Timezone handling — UTC stored with local intent preserved, or a defensible alternative</>,
      <>
        Where the tree lives: adjacency list, materialised path or closure table, and whether
        you can say why
      </>,
      <>N+1 queries, and whether you caught them yourself</>,
    ],
    doneWhen: [
      <>Tests cover DST, month-end, and &ldquo;this and future&rdquo; edits</>,
      <>A one-year window expands in well under a second</>,
      <>The rule engine runs without a database</>,
    ],
  },
  {
    id: "problem-2",
    tag: "Problem 2 · Client state & sync",
    meta: "weight 35% · client-heavy",
    title: "Working offline, and merging back",
    intro: [
      <>
        Someone opens the app on the underground. They tick four tasks, rename a list, add
        two more, and close the laptop. Twenty minutes later the network returns — while in
        the meantime they edited one of those same tasks on their phone.
      </>,
      <>
        Nothing should be lost, nothing duplicated, and the person should never have to
        wonder which version won. This is the problem where a spinner pretending to be sync
        is visible to us immediately.
      </>,
    ],
    requirements: [
      <>
        Create, edit, complete and delete all keep working with the network off, once the
        app has loaded. A service worker is welcome but not required &mdash; we will test by
        loading the page, then going offline.
      </>,
      <>
        Every change is queued durably and replayed in order on reconnect. Closing the tab
        does not drop the queue.
      </>,
      <>
        Replay is <b>idempotent</b>: a retried request never creates a second task.
        Client-generated IDs or idempotency keys — your choice.
      </>,
      <>
        Writes carry a version. A stale write is rejected with <code>409</code>, not blindly
        applied.
      </>,
      <>
        A conflict is surfaced with both versions and a way to resolve it. Last-write-wins is
        acceptable <em>only</em> if you argue for it in <code>DECISIONS.md</code>.
      </>,
      <>Each row shows its own state: pending, synced, failed. Failed is retryable.</>,
    ],
    readFor: [
      <>Who owns the truth — server cache, local store, or an unhappy mixture of both</>,
      <>Rollback on failure: does the UI actually return to a correct state?</>,
      <>Whether the sync layer is testable without a browser</>,
      <>Whether a failed replay can be retried without duplicating work</>,
    ],
    doneWhen: [
      <>An airplane-mode walkthrough in the README that we can repeat</>,
      <>A test forces a 409 and asserts the resolution</>,
      <>Killing the tab mid-queue loses nothing</>,
    ],
  },
  {
    id: "problem-3",
    tag: "Problem 3 · Access control",
    meta: "weight 30% · cross-cutting",
    title: "Shared lists, roles, and proof of who did what",
    intro: [
      <>
        A list can be shared by email with three roles. An <b>owner</b> manages members and
        can delete the list. An <b>editor</b> changes tasks but not membership. A{" "}
        <b>viewer</b> reads, and nothing else — including through the API, with a valid
        token, hand-crafting the request.
      </>,
      <>
        Hiding a button is not access control. We will call your endpoints directly with a
        viewer&rsquo;s credentials and someone else&rsquo;s task ID.
      </>,
    ],
    requirements: [
      <>Invite by email, accept, revoke, change role, leave a list. Invitations expire.</>,
      <>
        Every rule is enforced <b>server-side, in one place</b>. The client mirrors it for UX
        only.
      </>,
      <>
        No object is reachable by guessing an ID. No field is writable just because it
        appeared in the request body.
      </>,
      <>Sessions can be ended everywhere at once. Passwords have a stated policy and a modern hash.</>,
      <>An audit trail per task: who changed which field, from what, to what, when.</>,
      <>Login and invite endpoints are rate-limited, and the limit is tested.</>,
      <>
        An automated test walks the full matrix: three roles &times; every endpoint &times;
        allowed / denied.
      </>,
    ],
    readFor: [
      <>One authorisation seam, or the same check copy-pasted into fourteen handlers</>,
      <>IDOR and mass assignment — we test both directly</>,
      <>
        Whether errors leak existence (<code>403</code> vs <code>404</code>, and why)
      </>,
      <>What the audit trail costs on a hot write path</>,
    ],
    doneWhen: [
      <>The role matrix test is green and readable</>,
      <>A viewer&rsquo;s token cannot mutate anything, by any route</>,
      <>Task history is visible in the UI</>,
    ],
  },
];

/* ---------------------------------- §03 --------------------------------- */

export const groundRules = {
  lede: "Short, and all of them matter. The first is the reason this assessment exists at all.",

  ruleZero: {
    eyebrow: "Rule 0 — non-negotiable",
    title: "Write this code yourself, by hand.",
    body: [
      <>
        We use AI-assisted coding every day in production, and you will too once you join.
        That is exactly why this assessment cannot be one. When the assistant designs the
        architecture, we learn nothing about the person — and on the day the generated answer
        is wrong, the cost lands on whoever owns the system.
      </>,
      <>
        So for these {site.window.replace(" from receipt", "")}:{" "}
        <b>the architecture and the three problem solutions are hand-written.</b> No
        AI-generated implementations, no pasted solutions. We are hiring the judgement, not
        the output.
      </>,
    ] satisfies ReactNode[],
    allowed: [
      <>Official docs, API references, language specs</>,
      <>
        Framework scaffolding CLIs (<code>rails new</code>, <code>create-vite</code>)
      </>,
      <>Libraries you would normally reach for — declare them</>,
      <>Editor autocomplete, linters, formatters, type checkers</>,
      <>AI to explain an unfamiliar concept to you</>,
    ] satisfies ReactNode[],
    forbidden: [
      <>AI-generated implementations of Problems 1&ndash;3</>,
      <>AI-designed schema, module boundaries or sync strategy</>,
      <>Agents that write, refactor or test the repository for you</>,
      <>Existing to-do templates or forked starter solutions</>,
      <>Someone else&rsquo;s hands on the keyboard</>,
    ] satisfies ReactNode[],
    enforcement: (
      <>
        <b>How this is checked, plainly:</b> we read your commit history, we read{" "}
        <code>DECISIONS.md</code>, and we sit with you for an hour while you walk through the
        code and change it live. Authorship becomes obvious in about ten minutes. There is no
        penalty for saying &ldquo;I ran out of time here&rdquo; — there is a hard stop for
        work you cannot explain.
      </>
    ),
  },

  rest: [
    <>
      <b>Start from the starter — or port it.</b> The starter is {site.starterRuntime} with
      zero dependencies, and it is a reference, not a cage. If you would rather be judged in
      Python, Go, Ruby, Java, PHP, Rust or .NET, port it and work there. Two things have to
      survive the port: <b>the API contract</b> (same paths, same status codes, same error
      shape) and <b>what the schema means</b>. The porting hours come out of your own
      budget, and we review the port as part of your work. Either way, name your choice in
      the first line of <code>DECISIONS.md</code>.
    </>,
    <>
      <b>{site.effort}, hard stop.</b> The clock starts when we send the brief and does not
      pause, so tell us the day that suits you and we will send it that morning. Spend the
      first half hour reading the starter and deciding what you will attempt — that choice
      is part of what we are assessing. When the time is up, push what you have.
    </>,
    <>
      <b>Scope down before you fake up.</b> A stub with a clear <code>TODO</code> and a
      paragraph of reasoning scores; a mock pretending to be a working feature does not.
    </>,
    <>
      <b>No points for visual design.</b> Plain HTML is fine, a component library is fine.
      Keyboard access and sensible empty and error states do count — that is product
      thinking, not decoration.
    </>,
    <>
      <b>Test where it hurts.</b> We are not counting coverage. We are looking for tests
      around recurrence, sync replay and the permission matrix.
    </>,
    <>
      <b>Never commit secrets.</b> Ship <code>.env.example</code>. A live key in the history
      is an automatic stop — here and in production.
    </>,
    <>
      <b>Ask us things.</b> Ambiguity in this brief is not a trap, it is normal. A sharp
      question by email is a positive signal, not a strike.
    </>,
  ] satisfies ReactNode[],
};

/* ---------------------------------- §04 --------------------------------- */

export const scoring = {
  lede: `Two engineers read your repository independently, roughly 45 minutes each, before comparing notes. Then a ${site.walkthroughMinutes}-minute walkthrough call where you drive and we ask you to make one small change live.`,

  rubric: [
    {
      criterion: "Architecture",
      detail: (
        <>
          Clear boundaries, domain logic separable from the framework, a schema that survives
          the next feature.
        </>
      ),
      weight: 30,
    },
    {
      criterion: "Problem correctness",
      detail: <>The stated behaviours actually hold, including at the edges we named.</>,
      weight: 30,
    },
    {
      criterion: "Code & tests",
      detail: (
        <>Readable, consistent, tested where the risk is. Naming we don&rsquo;t have to decode.</>
      ),
      weight: 20,
    },
    {
      criterion: "Security",
      detail: (
        <>
          Authorisation enforced server-side, no IDOR, no mass assignment, no secrets
          committed.
        </>
      ),
      weight: 10,
    },
    {
      criterion: "Communication",
      detail: (
        <>
          A README that runs, a <code>DECISIONS.md</code> that reasons, commits that tell a
          story.
        </>
      ),
      weight: 10,
    },
  ],

  partialCredit: (
    <>
      <b>On finishing fewer than three.</b> In eight hours most candidates finish one.
      That is the expected outcome, not a shortfall. Name the problems you attempted at the
      top of your README and we grade those on their merits, rather than averaging in ones
      you never started. One problem finished properly scores above three left half-built
      &mdash; so when the clock gets short, stop and polish rather than starting another.
    </>
  ),

  separators: [
    <>
      <b>Naming the trade-off you took, and its cost.</b> Every real decision has one.
      Candidates who write it down interview far better an hour later.
    </>,
    <>
      <b>Handling the ugly case.</b> The 31st of February, the duplicate replay, the viewer
      with a stolen ID. That is most of the job.
    </>,
    <>
      <b>Commits with a shape.</b> A week of incremental, scoped commits reads as thinking.
      One 4,000-line &ldquo;initial commit&rdquo; reads as a paste.
    </>,
    <>
      <b>Knowing what you skipped.</b> A short &ldquo;what I&rsquo;d do next, and why not
      now&rdquo; is worth more than another half-built feature.
    </>,
  ] satisfies ReactNode[],
};

/* ---------------------------------- §05 --------------------------------- */

export const submission = {
  lede: "Push it to GitHub and send us the link before your eight hours are up. That link is the whole submission — no archives, no attachments — and the timestamp on your email is the one we go by.",

  steps: [
    <>
      <b>Put the starter in your own repository.</b> Fork{" "}
      <a href={site.starterRepo}>the starter repo</a>, or clone it and push to a fresh
      repository of your own — either is fine, and a clean repo keeps your history readable.
      Public is easiest; if you prefer private, invite <code>{site.reviewerHandle}</code> and
      say so in your email.
    </>,
    <>
      <b>Commit as you go.</b> Small, scoped commits with real messages, clearly yours
      rather than folded into the starter&rsquo;s first commit. Don&rsquo;t squash the
      history before sending it. If the clock runs out mid-change, commit it anyway with a
      note — an honest unfinished branch beats a missed deadline.
    </>,
    <>
      <b>Write the README.</b> One command to run it, one command to test it, prerequisites,
      and a two-minute tour of where each problem is solved.
    </>,
    <>
      <b>
        Write <code>DECISIONS.md</code>.
      </b>{" "}
      Stack choice, schema choices, the recurrence model, the sync strategy, the
      authorisation seam, what you cut and why. A page is plenty.
    </>,
    <>
      <b>Tag the final commit</b> <code>{site.submissionTag}</code>, so we review the version
      you meant to send.
    </>,
    <>
      <b>Email the link</b> to <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>
      , subject <code>{site.emailSubject}</code>. Add anything we should know before opening
      it.
    </>,
  ] satisfies ReactNode[],

  // Keyed: this array is a prop of <Checklist>, a client component.
  checklist: nodes(
    <>Repository is on GitHub and a reviewer can open it</>,
    <>README runs the app from a clean clone, on a machine that isn&rsquo;t yours</>,
    <>
      <code>DECISIONS.md</code> explains the recurrence model, the sync strategy and the
      authorisation seam
    </>,
    <>
      <code>.env.example</code> is committed — and no real secret is anywhere in the history
    </>,
    <>The test suite passes from a clean checkout</>,
    <>Each of the three problems is either finished or explicitly marked unfinished</>,
    <>
      Final commit is tagged <code>{site.submissionTag}</code>
    </>,
    <>Every line in the repository is yours, and you can explain it out loud</>,
  ),

  afterwards: [
    <>
      <b>Within {site.acknowledgeWithin}</b> — we confirm receipt.
    </>,
    <>
      <b>Within {site.reviewWithin}</b> — two engineers have read the repository
      independently.
    </>,
    <>
      <b>Then</b> — a {site.walkthroughMinutes}-minute walkthrough: you screen-share, we ask
      why, and we ask for one small live change.
    </>,
    <>
      <b>Either way, you get notes.</b> Every submission receives written feedback, including
      the ones we don&rsquo;t take forward.
    </>,
  ] satisfies ReactNode[],
};

/* ---------------------------------- §06 --------------------------------- */

export const faq: { q: string; a: ReactNode }[] = [
  {
    q: "Is it really a problem if I use AI? Everyone does.",
    a: (
      <>
        For this week, yes. We use it daily on the job and you will too — but a generated
        repository tells us nothing about how <em>you</em> decide. It surfaces in the
        walkthrough call anyway, so declaring it up front costs you far less than being asked
        to explain code you didn&rsquo;t write.
      </>
    ),
  },
  {
    q: "Can anyone really finish all three in eight hours?",
    a: (
      <>
        No, and you are not meant to. The limit is deliberately less than the work, because
        what you choose to do under it is most of what we learn about you. Pick what you can
        finish, do it properly, and write down what you left and how you would have
        approached it. Prioritisation is part of what we are measuring.
      </>
    ),
  },
  {
    q: "Do I have to use the Node starter?",
    a: (
      <>
        No. Port it to whatever you would rather be judged in — the API contract and the
        schema&rsquo;s meaning are what must survive, not the language. Be honest with
        yourself about the trade: a port might cost two of your hours, and those hours come
        off the three problems. If Node is fine by you, starting where the starter starts is
        not a mark against you.
      </>
    ),
  },
  {
    q: "Can I rewrite parts of the starter I disagree with?",
    a: (
      <>
        Yes, and telling us why is worth more than the rewrite. It is ordinary code with
        ordinary compromises — if you would have modelled something differently, change it
        and put a paragraph in <code>DECISIONS.md</code>. What we do not want is a silent
        rewrite we have to discover by diffing.
      </>
    ),
  },
  {
    q: "Can I use a framework or library that does half of this for me?",
    a: (
      <>
        Yes — use what you&rsquo;d use at work, including a sync or auth library. Declare it,
        and be ready to explain what it does underneath. Reaching for a mature library is
        engineering; not knowing what it handles is not.
      </>
    ),
  },
  {
    q: "A mobile app instead of a web client?",
    a: (
      <>
        Fine, if we can run it. React Native, Flutter or native all work. Tell us in the
        README exactly how to get it onto a simulator.
      </>
    ),
  },
  {
    q: "Do I need to deploy it?",
    a: (
      <>
        No. A working local setup is enough, and <code>docker compose up</code> is the
        friendliest version of that. If you do deploy, keep it running until we&rsquo;ve
        reviewed.
      </>
    ),
  },
  {
    q: "Who owns the code afterwards?",
    a: (
      <>
        You do. It is your repository and your portfolio piece. We keep our review notes and
        nothing else, and we never reuse submitted code.
      </>
    ),
  },
];
