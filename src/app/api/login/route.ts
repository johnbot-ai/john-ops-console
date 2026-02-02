import { NextResponse } from "next/server";
import { createSessionCookieValue, getCookieName } from "@/lib/auth";

export async function POST(req: Request) {
  const { password } = (await req.json().catch(() => ({}))) as {
    password?: string;
  };

  const expected = process.env.OPS_PASSWORD;
  if (!expected) {
    return NextResponse.json(
      { ok: false, error: "Server not configured (missing OPS_PASSWORD)" },
      { status: 500 }
    );
  }

  if (!password || password !== expected) {
    return NextResponse.json({ ok: false, error: "Invalid password" }, { status: 401 });
  }

  const token = await createSessionCookieValue();
  const res = NextResponse.json({ ok: true });

  res.cookies.set({
    name: getCookieName(),
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return res;
}
