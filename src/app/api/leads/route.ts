import { NextRequest, NextResponse } from "next/server";
import { getLeads, createLead } from "@/lib/services/leadService";
import { processNewLead } from "@/lib/services/routingService";
import type { LeadStatus } from "@prisma/client";

// GET /api/leads â list leads with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const result = await getLeads({
      status: (searchParams.get("status") as LeadStatus) || undefined,
      researchInterest: searchParams.get("brand") || undefined,
      territoryMatch: searchParams.get("territory") || undefined,
      assignedRepId: searchParams.get("repId") || undefined,
      search: searchParams.get("search") || undefined,
      sortBy: searchParams.get("sortBy") || undefined,
      sortDir: (searchParams.get("sortDir") as "asc" | "desc") || undefined,
      page: searchParams.get("page") ? parseInt(searchParams.get("page")!) : undefined,
      pageSize: searchParams.get("pageSize") ? parseInt(searchParams.get("pageSize")!) : undefined,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("[API] GET /api/leads error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch leads" },
      { status: 500 }
    );
  }
}

// POST /api/leads â create a new lead and process it
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const lead = await createLead({
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      title: body.title,
      phone: body.phone,
      firmName: body.firmName,
      registrationType: body.registrationType || "other",
      researchInterest: body.researchInterest || "unknown",
      source: body.source,
      city: body.city,
      state: body.state,
      country: body.country,
    });

    // Process the lead asynchronously (enrich, score, route)
    processNewLead(lead.id).catch((err) =>
      console.error(`[API] Background processing failed for lead ${lead.id}:`, err)
    );

    return NextResponse.json(
      { success: true, data: lead, message: "Lead created and processing started" },
      { status: 201 }
    );
  } catch (error) {
    console.error("[API] POST /api/leads error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create lead" },
      { status: 500 }
    );
  }
}
