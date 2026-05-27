import { cookies } from "next/headers";
import { NextResponse } from "next/server";

function baseUrls() {
  return [process.env.INTERNAL_API_URL, process.env.NEXT_PUBLIC_API_URL].filter(
    (v): v is string => typeof v === "string" && v.length > 0,
  );
}

export async function GET(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("si_token")?.value;
  if (!token) {
    return NextResponse.json({ success: false, message: "Unauthenticated." }, { status: 401 });
  }

  const bases = baseUrls();
  if (bases.length === 0) {
    return NextResponse.json(
      { success: false, message: "Falta configurar INTERNAL_API_URL o NEXT_PUBLIC_API_URL." },
      { status: 500 },
    );
  }

  const incoming = new URL(req.url);

  let lastError: unknown = null;
  for (const baseUrl of bases) {
    try {
      const upstreamUrl = new URL(`${baseUrl}/api/miembros`);
      upstreamUrl.search = incoming.search;

      const upstream = await fetch(upstreamUrl.toString(), {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      const text = await upstream.text();
      try {
        return NextResponse.json(text ? JSON.parse(text) : null, { status: upstream.status });
      } catch {
        return new NextResponse(text, {
          status: upstream.status,
          headers: {
            "Content-Type": upstream.headers.get("Content-Type") ?? "text/plain",
          },
        });
      }
    } catch (err) {
      lastError = err;
    }
  }

  return NextResponse.json(
    {
      success: false,
      message: "No se pudo conectar con la API del backend.",
      errors: { upstream: [String(lastError ?? "Error desconocido")] },
    },
    { status: 502 },
  );
}

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("si_token")?.value;
  if (!token) {
    return NextResponse.json({ success: false, message: "Unauthenticated." }, { status: 401 });
  }

  const bases = baseUrls();
  if (bases.length === 0) {
    return NextResponse.json(
      { success: false, message: "Falta configurar INTERNAL_API_URL o NEXT_PUBLIC_API_URL." },
      { status: 500 },
    );
  }

  const body = await req.text();

  let lastError: unknown = null;
  for (const baseUrl of bases) {
    try {
      const upstream = await fetch(`${baseUrl}/api/miembros`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body,
        cache: "no-store",
      });

      const text = await upstream.text();
      try {
        return NextResponse.json(text ? JSON.parse(text) : null, { status: upstream.status });
      } catch {
        return new NextResponse(text, {
          status: upstream.status,
          headers: {
            "Content-Type": upstream.headers.get("Content-Type") ?? "text/plain",
          },
        });
      }
    } catch (err) {
      lastError = err;
    }
  }

  return NextResponse.json(
    {
      success: false,
      message: "No se pudo conectar con la API del backend.",
      errors: { upstream: [String(lastError ?? "Error desconocido")] },
    },
    { status: 502 },
  );
}
