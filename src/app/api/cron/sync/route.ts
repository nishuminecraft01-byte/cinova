import { NextResponse } from "next/server";
import { syncEngine } from "@/lib/sync/sync-engine";

export const maxDuration = 60; // Allow up to 60 seconds for background sync
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    // Optional CRON secret check for secured Vercel Cron invocation
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized cron trigger" }, { status: 401 });
    }

    const result = await syncEngine.runFullSync("CRON");

    return NextResponse.json({
      success: true,
      message: "Scheduled 6-hour background sync completed successfully.",
      result,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Cron synchronization failed" },
      { status: 500 }
    );
  }
}
