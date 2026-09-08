import { createApp } from "./app.js";
import { config } from "./config.js";
import { closeDb, getDb } from "./db/connection.js";
import { deleteExpiredSessions } from "./repositories/sessions.js";

// Opening the database applies migrations, so `npm start` on a fresh clone is
// the only command needed.
getDb();
deleteExpiredSessions();

const app = createApp();
const server = app.listen(config.port, config.host, () => {
  console.log(`\n  Task manager API`);
  console.log(`  → http://${config.host}:${config.port}`);
  console.log(`  database: ${config.databaseFile}`);
  console.log(`  env: ${config.nodeEnv}\n`);
});

function shutdown(signal: string): void {
  console.log(`\n${signal} received, closing.`);
  server.close(() => {
    closeDb();
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
