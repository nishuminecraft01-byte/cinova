export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { syncEngine } from "@/lib/sync/sync-engine";
import { requireAdminSession } from "@/lib/supabase-server";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const guard = await requireAdminSession(request);
  if (!guard.ok) {
    return NextResponse.json(
      { success: false, error: guard.error || "Unauthorized" },
      { status: guard.status, headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    const result = await syncEngine.runFullSync("MANUAL");
    const status = syncEngine.getSyncStatus();

    return NextResponse.json(
      {
        success: true,
        message: "Manual synchronization completed successfully.",
        result,
        status,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Manual sync failed" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
