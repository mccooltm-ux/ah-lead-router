import { NextRequest, NextResponse } from "next/server";
import { detectStaleLeads } from "@/lib/services/conversionService";

/**
 * GET /api/cron/stale-detection
 *
 * Vercel Cron Job: Detects leads that have gone stale (no action taken).
 * Runs daily at 9 AM on weekdays (configurable in vercel.json).
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    const expectedSecret = process.env.CRON_SECRET;
    if (expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const staleCount = await detectStaleLeads();

    return NextResponse.json({
      success: true,
      data: {
        staleLeadsFound: staleCount,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("[Cron] stale-detection error:", error);
    return NextResponse.json(
      { success: false, error: "Stale detection failed" },
      { status: 500 }
    );
  }
}
