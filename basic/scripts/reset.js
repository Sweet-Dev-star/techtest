import fs from "node:fs";
import process from "node:process";
import { config } from "../src/config.js";

if (config.databaseFile === ":memory:") {
  console.log("DATABASE_FILE is :memory: — nothing on disk to remove.");
  process.exit(0);
}

// WAL mode leaves two sidecar files next to the database.
const removed = [config.databaseFile, `${config.databaseFile}-shm`, `${config.databaseFile}-wal`].filter(
  (file) => {
    if (!fs.existsSync(file)) return false;
    try {
      fs.rmSync(file);
      return true;
    } catch (error) {
      // Windows locks an open SQLite file; the server is almost certainly running.
      if (error.code === "EPERM" || error.code === "EBUSY") {
        console.error(`Cannot delete ${file} — it is still open.`);
        console.error("Stop the server (Ctrl+C in the terminal running it), then run this again.");
        process.exit(1);
      }
      throw error;
    }
  },
);

console.log(
  removed.length === 0
    ? "No database file to remove."
    : `Removed:\n${removed.map((file) => `  ${file}`).join("\n")}`,
);
console.log("Run `npm start` to recreate it, or `npm run seed` for demo data.");
