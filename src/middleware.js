import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { SESSION_COOKIE } from "./lib/session";

const PUBLIC_PAGES = ["/login", "/signup"];

async function isAuthed(req) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token || !process.env.AUTH_SECRET) return false;
  try {
    await jwtVerify(token, new TextEncoder().encode(process.env.AUTH_SECRET));
    return true;
  } catch {
    return false;
  }
}

export async function middleware(req) {
  const { pathname } = req.nextUrl;
  const authed = await isAuthed(req);
  const isPublic = PUBLIC_PAGES.includes(pathname);

  if (pathname.startsWith("/api/")) {
    if (!authed && !pathname.startsWith("/api/auth/"))
      return NextResponse.json({ error: "Please log in again." }, { status: 401 });
    return NextResponse.next();
  }
  if (!authed && !isPublic) return NextResponse.redirect(new URL("/login", req.url));
  if (authed && isPublic) return NextResponse.redirect(new URL("/", req.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|ico)$).*)"],
};
