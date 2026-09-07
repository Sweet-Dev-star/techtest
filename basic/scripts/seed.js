import process from "node:process";
import { transaction } from "../src/db/connection.js";
import { migrate } from "../src/db/migrate.js";
import { createList } from "../src/db/repositories/lists.js";
import { createTask } from "../src/db/repositories/tasks.js";
import { createUser, findUserByEmail } from "../src/db/repositories/users.js";
import { hashPassword } from "../src/domain/passwords.js";

/**
 * Demo data.
 *
 *   npm run seed                    a handful of realistic lists and tasks
 *   npm run seed -- --tasks 5000    plus one list with 5,000 generated tasks
 *
 * The bulk list exists so you can see how your UI behaves at size without
 * writing a throwaway loop first.
 */

const EMAIL = "demo@example.com";
const PASSWORD = "password123";

function readTaskCount(argv) {
  const index = argv.findIndex((arg) => arg === "--tasks" || arg.startsWith("--tasks="));
  if (index === -1) return 0;

  const raw = argv[index].includes("=") ? argv[index].split("=")[1] : argv[index + 1];
  const count = Number(raw);

  if (!Number.isInteger(count) || count < 1) {
    console.error("--tasks needs a positive whole number, e.g. --tasks 5000");
    process.exit(1);
  }
  return count;
}

function daysFromNow(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(9, 0, 0, 0);
  return date.toISOString();
}

const SEED_DATA = [
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
  {
    list: "Someday",
    tasks: [
      { title: "Learn to make sourdough", priority: 1, dueAt: null },
      { title: "Read the SQLite internals book", priority: 1, dueAt: null },
    ],
  },
];

const VERBS = ["Review", "Draft", "Refactor", "Ship", "Investigate", "Document", "Migrate", "Chase"];
const NOUNS = ["the invoice job", "the search index", "the webhook retries", "the billing report",
  "the staging cluster", "the onboarding email", "the audit log", "the rate limiter"];

/** Varied enough that filtering, searching and sorting all have something to bite on. */
function generatedTask(index) {
  const verb = VERBS[index % VERBS.length];
  const noun = NOUNS[(index * 7) % NOUNS.length];
  const hasDue = index % 3 !== 0;

  return {
    title: `${verb} ${noun} #${index + 1}`,
    priority: (index % 3) + 1,
    status: index % 5 === 0 ? "done" : "open",
    dueAt: hasDue ? daysFromNow((index % 60) - 20) : null,
  };
}

migrate();

let user = findUserByEmail(EMAIL);
let created = 0;

if (!user) {
  user = createUser({ email: EMAIL, passwordHash: hashPassword(PASSWORD), displayName: "Demo" });

  for (const { list: name, tasks } of SEED_DATA) {
    const list = createList({ ownerId: user.id, name });
    for (const task of tasks) {
      createTask({
        listId: list.id,
        title: task.title,
        notes: null,
        priority: task.priority,
        status: task.status ?? "open",
        dueAt: task.dueAt,
      });
      created += 1;
    }
  }

  console.log(`Seeded ${SEED_DATA.length} lists and ${created} tasks.`);
} else {
  console.log(`${EMAIL} already exists — leaving the existing lists alone.`);
}

const bulkCount = readTaskCount(process.argv.slice(2));

if (bulkCount > 0) {
  const started = Date.now();

  // One transaction: 5,000 separate commits would take minutes rather than a second.
  const list = transaction(() => {
    const target = createList({ ownerId: user.id, name: `Load test (${bulkCount})` });
    for (let i = 0; i < bulkCount; i += 1) {
      const task = generatedTask(i);
      createTask({ listId: target.id, notes: null, ...task });
    }
    return target;
  });

  console.log(`Added "${list.name}" with ${bulkCount} tasks in ${Date.now() - started}ms.`);
}

console.log(`Sign in with ${EMAIL} / ${PASSWORD}`);
