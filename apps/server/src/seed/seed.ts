import { randomBytes, scryptSync } from "node:crypto";
import { db } from "../db/database";

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");

  return `${salt}:${hash}`;
}

const users = [
  {
    id: "user_marketer_001",
    name: "Demo Marketer",
    email: "marketer@launchlock.demo",
    password: "Marketer@123",
    role: "MARKETER"
  },
  {
    id: "user_reviewer_001",
    name: "Demo Reviewer",
    email: "reviewer@launchlock.demo",
    password: "Reviewer@123",
    role: "REVIEWER"
  }
];

const insertUser = db.prepare(`
  INSERT OR IGNORE INTO users
  (id, name, email, password_hash, role)
  VALUES (?, ?, ?, ?, ?)
`);

const seedUsers = db.transaction(() => {
  for (const user of users) {
    insertUser.run(
      user.id,
      user.name,
      user.email,
      hashPassword(user.password),
      user.role
    );
  }
});

seedUsers();

console.log("Demo users seeded successfully.");

db.close();
