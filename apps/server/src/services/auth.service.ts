import {
  randomBytes,
  createHash,
  scryptSync,
  timingSafeEqual
} from "node:crypto";

import { db } from "../db/database";

interface UserRow {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: "MARKETER" | "REVIEWER";
}

function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, originalHash] = storedHash.split(":");

  if (!salt || !originalHash) return false;

  const suppliedHash = scryptSync(password, salt, 64);
  const expectedHash = Buffer.from(originalHash, "hex");

  return suppliedHash.length === expectedHash.length &&
    timingSafeEqual(suppliedHash, expectedHash);
}

export function login(email: string, password: string) {
  const user = db.prepare(
    "SELECT * FROM users WHERE email = ?"
  ).get(email.toLowerCase().trim()) as UserRow | undefined;

  if (!user || !verifyPassword(password, user.password_hash)) {
    return null;
  }

  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");

  const durationHours = Number(
    process.env.SESSION_DURATION_HOURS ?? 24
  );

  const expiresAt = new Date(
    Date.now() + durationHours * 60 * 60 * 1000
  ).toISOString();

  db.prepare(`
    INSERT INTO sessions (id, user_id, token_hash, expires_at)
    VALUES (?, ?, ?, ?)
  `).run(
    randomBytes(16).toString("hex"),
    user.id,
    tokenHash,
    expiresAt
  );

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    },
    expiresAt
  };
}

export function authenticateToken(token: string) {
  const tokenHash = createHash("sha256").update(token).digest("hex");

  const session = db.prepare(`
    SELECT
      users.id,
      users.name,
      users.email,
      users.role,
      sessions.expires_at
    FROM sessions
    JOIN users ON users.id = sessions.user_id
    WHERE sessions.token_hash = ?
  `).get(tokenHash) as {
    id: string;
    name: string;
    email: string;
    role: "MARKETER" | "REVIEWER";
    expires_at: string;
  } | undefined;

  if (!session) return null;

  if (new Date(session.expires_at).getTime() <= Date.now()) {
    db.prepare("DELETE FROM sessions WHERE token_hash = ?")
      .run(tokenHash);
    return null;
  }

  return {
    id: session.id,
    name: session.name,
    email: session.email,
    role: session.role
  };
}
