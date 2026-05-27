import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const loginUrl = new URL("/login", req.url);

  const token = req.cookies.get("si_token")?.value;
  if (!token) return NextResponse.redirect(loginUrl);

  const baseUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) return NextResponse.redirect(loginUrl);

  try {
    const me = await fetch(`${baseUrl}/api/auth/me`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (me.ok) return NextResponse.next();
    return NextResponse.redirect(loginUrl);
  } catch {
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: ["/admin/:path*"],
};
