import { NextResponse } from "next/server";
import { leadRepo } from "@/lib/db";

export const runtime = "nodejs";

/**
 * GET /api/demo/seed â returns store status (kept for backward compatibility)
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      totalLeads: leadRepo.count(),
      lastSyncedAt: globalThis.lastCrmSync || null,
      message: "Use POST /api/crm/import to sync leads from CRM",
    },
  });
}

export async function POST() {
  return NextResponse.json({
    success: true,
    data: {
      totalLeads: leadRepo.count(),
      message: "Demo seeding is deprecated. Use the 'Sync from CRM' button to import real leads.",
    },
  });
}
