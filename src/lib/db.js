import "server-only";
import { createClient } from "@libsql/client";

const globalForDb = globalThis;

function makeClient() {
  const url = process.env.TURSO_DATABASE_URL || "file:local.db";
  const authToken = process.env.TURSO_AUTH_TOKEN || undefined;
  return createClient({ url, authToken });
}

export const db = globalForDb.__wpDb ?? makeClient();
if (process.env.NODE_ENV !== "production") globalForDb.__wpDb = db;

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS profiles (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    data TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS plans (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_json TEXT NOT NULL,
    source TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE INDEX IF NOT EXISTS plans_user_active ON plans(user_id, active)`,
  `CREATE TABLE IF NOT EXISTS workout_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id TEXT,
    date TEXT NOT NULL,
    exercise_name TEXT NOT NULL,
    set_index INTEGER NOT NULL,
    reps INTEGER,
    weight_kg REAL,
    completed_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS logs_unique_set ON workout_logs(user_id, date, exercise_name, set_index)`,
  `CREATE INDEX IF NOT EXISTS logs_user_date ON workout_logs(user_id, date)`,
  `CREATE TABLE IF NOT EXISTS body_metrics (
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    weight_kg REAL NOT NULL,
    PRIMARY KEY (user_id, date)
  )`,
];

let ready;
export function ensureSchema() {
  if (!ready) {
    ready = (async () => {
      for (const sql of SCHEMA) await db.execute(sql);
    })().catch((e) => {
      ready = undefined;
      throw e;
    });
  }
  return ready;
}

export async function query(sql, args = []) {
  await ensureSchema();
  return db.execute({ sql, args });
}

export async function batch(statements) {
  await ensureSchema();
  return db.batch(statements, "write");
}

// ---- Domain helpers ----

export async function getUserById(id) {
  const r = await query("SELECT id, email, name, created_at FROM users WHERE id = ?", [id]);
  const row = r.rows[0];
  return row ? { id: row.id, email: row.email, name: row.name, createdAt: row.created_at } : null;
}

export async function getProfile(userId) {
  const r = await query("SELECT data FROM profiles WHERE user_id = ?", [userId]);
  return r.rows[0] ? JSON.parse(r.rows[0].data) : null;
}

export async function saveProfile(userId, data) {
  await query(
    `INSERT INTO profiles (user_id, data, updated_at) VALUES (?, ?, datetime('now'))
     ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`,
    [userId, JSON.stringify(data)]
  );
}

export async function getActivePlan(userId) {
  const r = await query(
    "SELECT id, plan_json, source, created_at FROM plans WHERE user_id = ? AND active = 1 ORDER BY created_at DESC LIMIT 1",
    [userId]
  );
  const row = r.rows[0];
  if (!row) return null;
  return { id: row.id, source: row.source, createdAt: row.created_at, ...JSON.parse(row.plan_json) };
}

export async function savePlan(userId, plan, source) {
  const id = crypto.randomUUID();
  await batch([
    { sql: "UPDATE plans SET active = 0 WHERE user_id = ?", args: [userId] },
    {
      sql: "INSERT INTO plans (id, user_id, plan_json, source, active) VALUES (?, ?, ?, ?, 1)",
      args: [id, userId, JSON.stringify(plan), source],
    },
  ]);
  return id;
}

export async function updatePlanJson(planId, userId, plan) {
  await query("UPDATE plans SET plan_json = ? WHERE id = ? AND user_id = ?", [JSON.stringify(plan), planId, userId]);
}

export async function deleteUser(userId) {
  await batch([
    { sql: "DELETE FROM workout_logs WHERE user_id = ?", args: [userId] },
    { sql: "DELETE FROM body_metrics WHERE user_id = ?", args: [userId] },
    { sql: "DELETE FROM plans WHERE user_id = ?", args: [userId] },
    { sql: "DELETE FROM profiles WHERE user_id = ?", args: [userId] },
    { sql: "DELETE FROM users WHERE id = ?", args: [userId] },
  ]);
}
