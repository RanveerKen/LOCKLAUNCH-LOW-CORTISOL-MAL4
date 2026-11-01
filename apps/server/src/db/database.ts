import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const databasePath = process.env.DATABASE_PATH ?? "./data/launchlock.db";

fs.mkdirSync(path.dirname(databasePath), { recursive: true });

export const db = new Database(databasePath);

db.pragma("foreign_keys = ON");
db.pragma("journal_mode = WAL");

const schemaPath = path.resolve(
  process.cwd(),
  "src/db/schema.sql"
);
const schema = fs.readFileSync(schemaPath, "utf8");
db.exec(schema);

console.log("LaunchLock database initialized.");
