import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { verifySessionCookieValue, getCookieName } from "./src/lib/auth";

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public routes
  if (pathname === "/login" || pathname.startsWith("/login/")) {
    return NextResponse.next();
  }

  // Public auth endpoints
  if (pathname === "/api/login" || pathname === "/api/logout") {
    return NextResponse.next();
  }

  const cookieName = getCookieName();
  const cookieValue = req.cookies.get(cookieName)?.value;
  const ok = await verifySessionCookieValue(cookieValue);

  if (ok) return NextResponse.next();

  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set("next", req.nextUrl.pathname + req.nextUrl.search);
  return NextResponse.redirect(loginUrl);
}
