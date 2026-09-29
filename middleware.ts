import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.AUTH_SECRET || "development-secret-change-me");

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("boxshot_session")?.value;
  if (!token) return NextResponse.redirect(new URL(`/signin?next=${encodeURIComponent(request.nextUrl.pathname)}`, request.url));
  try { await jwtVerify(token, secret); return NextResponse.next(); }
  catch { return NextResponse.redirect(new URL("/signin", request.url)); }
}

export const config = { matcher: ["/dashboard/:path*", "/editor/:path*"] };
