import fs from "node:fs";
import { config } from "../src/config.js";

if (config.databaseFile === ":memory:") {
  console.log("DATABASE_FILE is :memory: — nothing on disk to remove.");
  process.exit(0);
}

// WAL mode leaves two sidecar files next to the database.
const targets = [config.databaseFile, `${config.databaseFile}-shm`, `${config.databaseFile}-wal`];
const removed: string[] = [];

for (const file of targets) {
  if (!fs.existsSync(file)) continue;
  try {
    fs.rmSync(file);
    removed.push(file);
  } catch (error) {
    // Windows locks an open SQLite file; the server is almost certainly running.
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "EPERM" || code === "EBUSY") {
      console.error(`Cannot delete ${file} — it is still open.`);
      console.error("Stop the server (Ctrl+C in the terminal running it), then run this again.");
      process.exit(1);
    }
    throw error;
  }
}

console.log(
  removed.length === 0 ? "No database file to remove." : `Removed:\n${removed.map((f) => `  ${f}`).join("\n")}`,
);
console.log("Run `npm start` to recreate it, or `npm run seed` for demo data.");
