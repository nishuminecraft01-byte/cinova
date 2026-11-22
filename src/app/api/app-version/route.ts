import { NextResponse } from "next/server";
import appVersionData from "@/data/app-version.json";

export const dynamic = "force-dynamic";

export interface AppVersionResponse {
  versionCode: number;
  versionName: string;
  minSupportedVersionCode: number;
  apkUrl: string;
  apkSize: number;
  sha256?: string;
  releaseNotes: string;
  releasedAt: string;
  mandatory: boolean;
}

export async function GET() {
  const versionInfo: AppVersionResponse = {
    versionCode: appVersionData.versionCode,
    versionName: appVersionData.versionName,
    minSupportedVersionCode: appVersionData.minSupportedVersionCode || 1,
    apkUrl: appVersionData.apkUrl,
    apkSize: appVersionData.apkSize,
    sha256: appVersionData.sha256,
    releaseNotes: appVersionData.releaseNotes,
    releasedAt: appVersionData.releasedAt,
    mandatory: Boolean(appVersionData.mandatory),
  };

  return NextResponse.json(versionInfo, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

export async function HEAD() {
  return new Response(null, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=60, s-maxage=300",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
