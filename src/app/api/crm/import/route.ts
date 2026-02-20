import { NextRequest, NextResponse } from "next/server";
import { leadRepo } from "@/lib/db";
import type { CrmLeadImport } from "@/types";

export const runtime = "nodejs";

/**
 * POST /api/crm/import
 * Accepts an array of CRM leads and imports them into the lead store.
 * Called client-side after the browser fetches from the CRM GraphQL API.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!Array.isArray(body.leads)) {
      return NextResponse.json(
        { success: false, error: "Expected { leads: CrmLeadImport[] }" },
        { status: 400 }
      );
    }

    const crmLeads: CrmLeadImport[] = body.leads;

    if (crmLeads.length === 0) {
      return NextResponse.json(
        { success: false, error: "No leads provided" },
        { status: 400 }
      );
    }

    // Clear existing data if requested
    if (body.replace === true) {
      leadRepo.clear();
    }

    const result = leadRepo.importFromCrm(crmLeads);

    return NextResponse.json(
      {
        success: true,
        data: {
          ...result,
          total: leadRepo.count(),
          syncedAt: new Date().toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error importing CRM leads:", error);
    return NextResponse.json(
      { success: false, error: "Failed to import CRM leads" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/crm/import â returns sync status
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      totalLeads: leadRepo.count(),
      lastSyncedAt: globalThis.lastCrmSync || null,
    },
  });
}
