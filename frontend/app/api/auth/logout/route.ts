import { cookies } from "next/headers";
import { NextResponse } from "next/server";

function baseUrls() {
  return [process.env.INTERNAL_API_URL, process.env.NEXT_PUBLIC_API_URL].filter(
    (v): v is string => typeof v === "string" && v.length > 0,
  );
}

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get("si_token")?.value;

  const res = NextResponse.json({ success: true, message: "Sesión cerrada." }, { status: 200 });
  res.cookies.delete("si_token");

  if (!token) {
    return res;
  }

  const bases = baseUrls();
  if (bases.length === 0) {
    return res;
  }

  for (const baseUrl of bases) {
    try {
      await fetch(`${baseUrl}/api/auth/logout`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      break;
    } catch {
    }
  }

  return res;
}
