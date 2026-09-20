import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { DEFAULT_SECURITY_CONFIG } from "@/security/securityConfig";

const PROTECTED_PREFIXES = [
  "/feed",
  "/create",
  "/messages",
  "/notifications",
  "/settings",
  "/profile",
  "/admin",
];

const AUTH_PAGES = ["/login", "/signup"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(DEFAULT_SECURITY_CONFIG.cookieName)?.value;

  const isProtectedPath = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const isAuthPage = AUTH_PAGES.some((page) => pathname === page || pathname.startsWith(page + "/"));

  // 1. If trying to access a protected page without an auth token cookie, redirect to /login
  if (isProtectedPath && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. If logged in and trying to access login/signup pages, redirect to /feed
  if (isAuthPage && token) {
    return NextResponse.redirect(new URL("/feed", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/feed/:path*",
    "/create/:path*",
    "/messages/:path*",
    "/notifications/:path*",
    "/settings/:path*",
    "/profile/:path*",
    "/admin/:path*",
    "/login",
    "/signup",
  ],
};
