import process from "node:process";
import { migrate } from "../src/db/migrate.js";
import { createList } from "../src/db/repositories/lists.js";
import { createTask } from "../src/db/repositories/tasks.js";
import { createUser, findUserByEmail } from "../src/db/repositories/users.js";
import { hashPassword } from "../src/domain/passwords.js";

const EMAIL = "demo@example.com";
const PASSWORD = "password123";

function daysFromNow(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(9, 0, 0, 0);
  return date.toISOString();
}

migrate();

if (findUserByEmail(EMAIL)) {
  console.log(`${EMAIL} already exists — nothing to do.`);
  process.exit(0);
}

const user = createUser({
  email: EMAIL,
  passwordHash: hashPassword(PASSWORD),
  displayName: "Demo",
});

const seedData = [
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

let taskCount = 0;

for (const { list: name, tasks } of seedData) {
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
    taskCount += 1;
  }
}

console.log(`Seeded ${seedData.length} lists and ${taskCount} tasks.`);
console.log(`Sign in with ${EMAIL} / ${PASSWORD}`);
