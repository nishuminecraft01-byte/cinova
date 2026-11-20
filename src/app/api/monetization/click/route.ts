
import { NextRequest, NextResponse } from "next/server";
import { recordClick, OutboundClickEvent } from "@/lib/monetization";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as OutboundClickEvent;

    if (!body || !body.providerName || !body.targetUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    recordClick({
      providerName: String(body.providerName).slice(0, 100),
      mediaType: body.mediaType === "tv" ? "tv" : "movie",
      tmdbId: String(body.tmdbId).slice(0, 50),
      title: String(body.title || "Untitled").slice(0, 200),
      country: String(body.country || "GLOBAL").toUpperCase().slice(0, 5),
      targetUrl: String(body.targetUrl).slice(0, 1000),
      category: body.category || "streaming_provider",
      timestamp: body.timestamp || new Date().toISOString(),
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}
