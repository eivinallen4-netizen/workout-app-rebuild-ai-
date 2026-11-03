import "server-only";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getUser } from "./auth";

export function json(data, status = 200) {
  return NextResponse.json(data, { status });
}

export function fail(message, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/** Wraps a route handler: requires a logged-in user and turns thrown errors into JSON. */
export function withUser(handler) {
  return async (req, ctx) => {
    try {
      const user = await getUser();
      if (!user) return fail("Please log in again.", 401);
      return await handler(req, user, ctx);
    } catch (e) {
      return handleError(e);
    }
  };
}

export function handleError(e) {
  if (e instanceof ZodError) {
    const first = e.issues[0];
    return fail(first ? `${first.path.join(".") || "Input"}: ${first.message}` : "Invalid input.", 422);
  }
  console.error(e);
  return fail("Something went wrong. Please try again.", 500);
}
