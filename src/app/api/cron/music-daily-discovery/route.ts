import { NextRequest, NextResponse } from "next/server";
import { runDailyMusicDiscovery } from "@/lib/discovery/music-discovery-engine";
import { getLastSyncLog, getDiscoveredCount } from "@/lib/discovery/discovered-music-store";

export const maxDuration = 60; // Up to 60 seconds for background discovery
export const dynamic = "force-dynamic";

/**
 * Validates request authorization:
 * - Checks `Authorization: Bearer <CRON_SECRET>` or `Bearer <ADMIN_SECRET>`
 * - Checks `?secret=<CRON_SECRET>`
 * - In local dev (localhost), allows authorized testing if no secret is configured
 */
function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization") || "";
  const { searchParams } = new URL(request.url);
  const querySecret = searchParams.get("secret");

  const cronSecret = process.env.CRON_SECRET;
  const adminSecret = process.env.ADMIN_SECRET || process.env.ADMIN_API_KEY;

  // 1. If CRON_SECRET is configured, require match
  if (cronSecret) {
    if (authHeader === `Bearer ${cronSecret}` || querySecret === cronSecret) {
      return true;
    }
  }

  // 2. If ADMIN_SECRET is configured, check it
  if (adminSecret) {
    if (authHeader === `Bearer ${adminSecret}` || querySecret === adminSecret) {
      return true;
    }
  }

  // 3. If neither secret is configured in environment, allow local development testing
  const host = request.headers.get("host") || "";
  if (!cronSecret && !adminSecret && (host.includes("localhost") || host.includes("127.0.0.1"))) {
    return true;
  }

  return false;
}

/**
 * GET handler: Scheduled 24-hour Cron trigger or status check
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || "sync";

    // If just checking status, return last sync log without running discovery
    if (action === "status") {
      const lastLog = await getLastSyncLog();
      return NextResponse.json({
        success: true,
        totalDiscovered: getDiscoveredCount(),
        lastSync: lastLog,
      });
    }

    // Verify authorization for executing discovery
    if (!isAuthorized(request)) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Missing or invalid CRON_SECRET or ADMIN_SECRET",
        },
        { status: 401 }
      );
    }

    const summary = await runDailyMusicDiscovery({
      triggeredBy: "CRON",
    });

    return NextResponse.json({
      success: summary.success,
      message: summary.success
        ? "Automatic daily music discovery completed successfully"
        : "Music discovery completed with warnings or quota limits",
      summary,
    });
  } catch (error: any) {
    console.error("[MusicCron] GET execution failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Scheduled music discovery failed",
      },
      { status: 500 }
    );
  }
}

/**
 * POST handler: Manual admin-triggered discovery
 */
export async function POST(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Missing or invalid authorization token",
        },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const maxRegions = typeof body.maxRegions === "number" ? body.maxRegions : 5;

    const summary = await runDailyMusicDiscovery({
      triggeredBy: "MANUAL_ADMIN",
      maxRegions,
    });

    return NextResponse.json({
      success: summary.success,
      message: "Manual music discovery executed successfully",
      summary,
    });
  } catch (error: any) {
    console.error("[MusicCron] POST execution failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Manual music discovery execution failed",
      },
      { status: 500 }
    );
  }
}
