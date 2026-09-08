import { getDb } from "../src/db/connection.js";
import { hashPassword } from "../src/domain/passwords.js";
import { createList } from "../src/repositories/lists.js";
import { createTask } from "../src/repositories/tasks.js";
import { createUser, findUserByEmail } from "../src/repositories/users.js";

/**
 * Demo data.
 *
 *   npm run seed                     a few realistic lists and tasks
 *   npm run seed -- --tasks 5000     plus one list with 5,000 generated tasks
 *
 * The bulk list exists so you can see how the app behaves at size without
 * writing a throwaway loop first.
 */

const EMAIL = "demo@example.com";
const USERNAME = "demo";
const PASSWORD = "password123";

function taskCount(argv: string[]): number {
  const index = argv.findIndex((arg) => arg === "--tasks" || arg.startsWith("--tasks="));
  if (index === -1) return 0;
  const raw = argv[index]!.includes("=") ? argv[index]!.split("=")[1] : argv[index + 1];
  const count = Number(raw);
  if (!Number.isInteger(count) || count < 1) {
    console.error("--tasks needs a positive whole number, e.g. --tasks 5000");
    process.exit(1);
  }
  return count;
}

function daysFromNow(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(9, 0, 0, 0);
  return date.toISOString();
}

type SeedTask = { title: string; priority: number; dueAt: string | null; status?: "open" | "done" };
type SeedList = { list: string; tasks: SeedTask[] };

const SEED: SeedList[] = [
  {
    list: "Work",
    tasks: [
      { title: "Write the sprint summary", priority: 3, dueAt: daysFromNow(-1) },
      { title: "Review the migration PR", priority: 2, dueAt: daysFromNow(0) },
      { title: "Update the on-call runbook", priority: 1, dueAt: daysFromNow(4) },
      { title: "Prepare Thursday's demo", priority: 3, dueAt: daysFromNow(2) },
      { title: "Archive the old dashboards", priority: 1, dueAt: null, status: "done" },
    ],
  },
  {
    list: "Personal",
    tasks: [
      { title: "Book the flights", priority: 3, dueAt: daysFromNow(6) },
      { title: "Renew the gym membership", priority: 2, dueAt: daysFromNow(12) },
      { title: "Return the library books", priority: 2, dueAt: daysFromNow(-3) },
      { title: "Fix the bike light", priority: 1, dueAt: null },
    ],
  },
];

const VERBS = ["Review", "Draft", "Refactor", "Ship", "Investigate", "Document", "Migrate", "Chase"];
const NOUNS = ["the invoice job", "the search index", "the webhook retries", "the billing report",
  "the staging cluster", "the onboarding email", "the audit log", "the rate limiter"];

const db = getDb();
let user = findUserByEmail(EMAIL);
let created = 0;

if (!user) {
  user = createUser({ username: USERNAME, email: EMAIL, passwordHash: hashPassword(PASSWORD) });
  for (const { list, tasks } of SEED) {
    const row = createList({ ownerId: user.id, name: list });
    for (const task of tasks) {
      createTask({ listId: row.id, title: task.title, priority: task.priority, status: task.status, dueAt: task.dueAt });
      created += 1;
    }
  }
  console.log(`Seeded ${SEED.length} lists and ${created} tasks.`);
} else {
  console.log(`${EMAIL} already exists — leaving the existing lists alone.`);
}

const bulk = taskCount(process.argv.slice(2));
if (bulk > 0) {
  const started = Date.now();
  // One transaction: 5,000 separate commits would take minutes rather than a second.
  const insertMany = db.transaction(() => {
    const list = createList({ ownerId: user!.id, name: `Load test (${bulk})` });
    for (let i = 0; i < bulk; i += 1) {
      const verb = VERBS[i % VERBS.length]!;
      const noun = NOUNS[(i * 7) % NOUNS.length]!;
      createTask({
        listId: list.id,
        title: `${verb} ${noun} #${i + 1}`,
        priority: (i % 3) + 1,
        status: i % 5 === 0 ? "done" : "open",
        dueAt: i % 3 === 0 ? null : daysFromNow((i % 60) - 20),
      });
    }
    return list;
  });
  const list = insertMany();
  console.log(`Added "${list.name}" with ${bulk} tasks in ${Date.now() - started}ms.`);
}

console.log(`Sign in with ${EMAIL} / ${PASSWORD}`);
