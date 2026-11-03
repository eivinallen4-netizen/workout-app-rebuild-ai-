import bcrypt from "bcryptjs";
import { z } from "zod";
import { query } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { json, fail, handleError } from "@/lib/http";

const schema = z.object({
  name: z.string().trim().min(1, "Enter your name").max(60),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(8, "Use at least 8 characters").max(200),
});

export async function POST(req) {
  try {
    const { name, email, password } = schema.parse(await req.json());
    const existing = await query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.rows.length) return fail("An account with this email already exists. Try logging in.", 409);

    const id = crypto.randomUUID();
    const hash = await bcrypt.hash(password, 10);
    await query("INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)", [id, email, hash, name]);
    await createSession(id);
    return json({ ok: true, next: "/onboarding" }, 201);
  } catch (e) {
    return handleError(e);
  }
}
