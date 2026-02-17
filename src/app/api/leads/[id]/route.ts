import { NextRequest, NextResponse } from "next/server";
import { getLeadById, addLeadNote, reassignLead } from "@/lib/services/leadService";
import { updateLeadStatus } from "@/lib/services/conversionService";
import type { LeadStatus } from "@prisma/client";

// GET /api/leads/:id â get lead detail
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const lead = await getLeadById(params.id);
    if (!lead) {
      return NextResponse.json(
        { success: false, error: "Lead not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: lead });
  } catch (error) {
    console.error(`[API] GET /api/leads/${params.id} error:`, error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch lead" },
      { status: 500 }
    );
  }
}

// PATCH /api/leads/:id â update lead status, add note, or reassign
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    // Update status
    if (body.status) {
      await updateLeadStatus(
        params.id,
        body.status as LeadStatus,
        body.changedBy || "user",
        body.reason
      );
    }

    // Add note
    if (body.note) {
      await addLeadNote(params.id, body.noteAuthor || "User", body.note);
    }

    // Reassign
    if (body.assignToRepId) {
      await reassignLead(params.id, body.assignToRepId, body.changedBy || "User");
    }

    const updatedLead = await getLeadById(params.id);
    return NextResponse.json({ success: true, data: updatedLead });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update lead";
    console.error(`[API] PATCH /api/leads/${params.id} error:`, error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}
