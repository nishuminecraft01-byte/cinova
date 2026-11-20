export const runtime = 'edge';

import { NextResponse } from "next/server";
import { syncEngine } from "@/lib/sync/sync-engine";

export const dynamic = "force-dynamic";

export async function GET() {
  const status = syncEngine.getSyncStatus();
  return NextResponse.json({
    success: true,
    status,
  });
}
