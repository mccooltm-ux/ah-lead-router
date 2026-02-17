import { NextRequest, NextResponse } from "next/server";
import { createLead } from "@/lib/services/leadService";
import { processNewLead } from "@/lib/services/routingService";

/**
 * POST /api/webhook â receive real-time lead registration webhooks
 *
 * Expected payload:
 * {
 *   "firstName": "John",
 *   "lastName": "Smith",
 *   "email": "jsmith@hedgefund.com",
 *   "title": "Portfolio Manager",
 *   "firmName": "Big Alpha Capital",
 *   "registrationType": "trial",
 *   "researchInterest": "sankey",
 *   "source": "web"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret (optional, for production)
    const authHeader = request.headers.get("authorization");
    const expectedSecret = process.env.CRON_SECRET;
    if (expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.firstName || !body.lastName || !body.email || !body.firmName) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: firstName, lastName, email, firmName",
        },
        { status: 400 }
      );
    }

    const lead = await createLead({
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      title: body.title,
      phone: body.phone,
      firmName: body.firmName,
      registrationType: body.registrationType || "other",
      researchInterest: body.researchInterest || "unknown",
      source: body.source || "webhook",
      city: body.city,
      state: body.state,
      country: body.country,
    });

    // Process in background
    processNewLead(lead.id).catch((err) =>
      console.error(`[Webhook] Processing failed for lead ${lead.id}:`, err)
    );

    return NextResponse.json(
      {
        success: true,
        data: { id: lead.id },
        message: "Lead received and processing",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[Webhook] Error:", error);
    return NextResponse.json(
      { success: false, error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
