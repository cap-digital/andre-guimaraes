import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Proxy de imagens: as URLs do fbcdn possuem proteção de hotlink/referer.
// Buscamos no servidor e devolvemos o binário com cache no navegador.
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("u");
  if (!url || !/^https:\/\/[^/]+\.fbcdn\.net\//.test(url)) {
    return new NextResponse("URL inválida", { status: 400 });
  }

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        Accept: "image/avif,image/webp,image/*,*/*;q=0.8",
      },
      cache: "no-store",
    });

    if (!res.ok || !res.body) {
      return new NextResponse("Falha ao buscar imagem", { status: 502 });
    }

    const contentType = res.headers.get("content-type") || "image/jpeg";
    const buf = await res.arrayBuffer();
    return new NextResponse(buf, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    return new NextResponse("Erro no proxy de imagem", { status: 502 });
  }
}
