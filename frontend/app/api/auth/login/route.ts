import { NextResponse } from "next/server";

function baseUrls() {
  return [process.env.INTERNAL_API_URL, process.env.NEXT_PUBLIC_API_URL].filter(
    (v): v is string => typeof v === "string" && v.length > 0,
  );
}

export async function POST(req: Request) {
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
      const upstream = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body,
      });

      const text = await upstream.text();
      const json = text ? JSON.parse(text) : null;

      if (!upstream.ok) {
        return NextResponse.json(json, { status: upstream.status });
      }

      const token = typeof json?.data?.token === "string" ? json.data.token : null;
      if (!token) {
        return NextResponse.json(
          { success: false, message: "Respuesta inválida del servidor (sin token)." },
          { status: 502 },
        );
      }

      const res = NextResponse.json(json, { status: 200 });
      res.cookies.set("si_token", token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      });
      return res;
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
