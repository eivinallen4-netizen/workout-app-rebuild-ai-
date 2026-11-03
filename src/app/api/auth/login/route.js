import bcrypt from "bcryptjs";
import { z } from "zod";
import { query, getProfile } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { json, fail, handleError } from "@/lib/http";

const schema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});

export async function POST(req) {
  try {
    const { email, password } = schema.parse(await req.json());
    const r = await query("SELECT id, password_hash FROM users WHERE email = ?", [email]);
    const user = r.rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash)))
      return fail("Email or password is incorrect.", 401);

    await createSession(user.id);
    const profile = await getProfile(user.id);
    return json({ ok: true, next: profile ? "/" : "/onboarding" });
  } catch (e) {
    return handleError(e);
  }
}
