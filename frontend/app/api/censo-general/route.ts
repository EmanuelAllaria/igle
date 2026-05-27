export async function POST(req: Request) {
  const baseUrls = [process.env.INTERNAL_API_URL, process.env.NEXT_PUBLIC_API_URL].filter(
    (v): v is string => typeof v === "string" && v.length > 0,
  );

  if (baseUrls.length === 0) {
    return Response.json(
      { success: false, message: "Falta configurar INTERNAL_API_URL o NEXT_PUBLIC_API_URL." },
      { status: 500 },
    );
  }

  const body = await req.json().catch(() => null);

  let lastError: unknown = null;

  for (const baseUrl of baseUrls) {
    try {
      const upstream = await fetch(`${baseUrl}/api/censo-general`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
      });

      const text = await upstream.text();

      try {
        const json = text ? JSON.parse(text) : null;
        return Response.json(json, { status: upstream.status });
      } catch {
        return new Response(text, {
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

  return Response.json(
    {
      success: false,
      message: "No se pudo conectar con la API del backend.",
      errors: { upstream: [String(lastError ?? "Error desconocido")] },
    },
    { status: 502 },
  );
}
