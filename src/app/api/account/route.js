import { deleteUser } from "@/lib/db";
import { clearSession } from "@/lib/auth";
import { json, withUser } from "@/lib/http";

export const DELETE = withUser(async (_req, user) => {
  await deleteUser(user.id);
  clearSession();
  return json({ ok: true });
});
