import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/supabase-server";
import { testMediaServerConnection, MediaServerType } from "@/lib/media-server";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/media-server/probe
 * Tests connection and authentication with an external or self-hosted media server (e.g. Jellyfin).
 * Admin-only. Keeps all tokens and API keys securely on the server.
 */
export async function POST(request: NextRequest) {
  const guard = await requireAdminSession(request);
  if (!guard.ok) {
    return NextResponse.json(
      { success: false, error: guard.error || "Unauthorized" },
      { status: guard.status, headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { type = "jellyfin", serverUrl, apiKey } = body as {
      type?: MediaServerType;
      serverUrl?: string;
      apiKey?: string;
    };

    if (!serverUrl || typeof serverUrl !== "string") {
      return NextResponse.json(
        { success: false, error: "Please provide a valid media server URL." },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    const result = await testMediaServerConnection({
      type: type as MediaServerType,
      serverUrl,
      apiKey,
    });

    return NextResponse.json(
      {
        success: result.connected,
        result,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Internal probe error." },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
