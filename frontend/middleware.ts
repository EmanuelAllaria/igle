import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

function baseUrls() {
  return [process.env.INTERNAL_API_URL, process.env.NEXT_PUBLIC_API_URL].filter(
    (v): v is string => typeof v === "string" && v.length > 0,
  );
}

export async function middleware(req: NextRequest) {
  const loginUrl = new URL("/login", req.url);

  const token = req.cookies.get("si_token")?.value;
  if (!token) return NextResponse.redirect(loginUrl);

  const bases = baseUrls();
  if (bases.length === 0) return NextResponse.redirect(loginUrl);

  for (const baseUrl of bases) {
    try {
      const me = await fetch(`${baseUrl}/api/auth/me`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      if (me.ok) return NextResponse.next();
      if (me.status === 401 || me.status === 403) return NextResponse.redirect(loginUrl);
    } catch {
      continue;
    }
  }

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*"],
};
