import http from "node:http";
import process from "node:process";
import { createApp } from "./app.js";
import { config } from "./config.js";
import { closeDb } from "./db/connection.js";
import { migrate } from "./db/migrate.js";
import { deleteExpiredSessions } from "./db/repositories/sessions.js";

// Migrations run on boot, so `npm start` on a fresh clone is the only command needed.
const applied = migrate({ log: (line) => console.log(`  ${line}`) });
if (applied.length > 0) console.log(`  ${applied.length} migration(s) applied`);

deleteExpiredSessions();

const server = http.createServer(createApp());

server.listen(config.port, config.host, () => {
  console.log(`\n  Task manager (baseline)`);
  console.log(`  → http://${config.host}:${config.port}`);
  console.log(`  database: ${config.databaseFile}\n`);
});

function shutdown(signal) {
  console.log(`\n${signal} received, closing.`);
  server.close(() => {
    closeDb();
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
