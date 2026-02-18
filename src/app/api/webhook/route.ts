import { NextRequest, NextResponse } from "next/server";
import { createLead } from "@/lib/services/leadService";
import { processNewLead } from "@/lib/services/routingService";
import {
  verifyAuth,
  validateWebhookPayload,
  checkRateLimit,
} from "@/lib/middleware/auth";

/**
 * POST /api/webhook — receive real-time lead registration webhooks
 *
 * FIXES APPLIED:
 * - Auth is now MANDATORY (not opt-in)
 * - Input validation with email format check
 * - Rate limiting (30 req/min per IP)
 * - String length limits to prevent abuse
 * - Duplicate detection by email
 */
export async function POST(request: NextRequest) {
  try {
    // ── Rate limit check ──────────────────────────────────────────────
    const rateLimitError = checkRateLimit(request);
    if (rateLimitError) return rateLimitError;

    // ── Auth check (MANDATORY) ────────────────────────────────────────
    const authError = verifyAuth(request);
    if (authError) return authError;

    // ── Parse & validate ──────────────────────────────────────────────
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const [payload, validationError] = validateWebhookPayload(body);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: validationError },
        { status: 400 }
      );
    }

    // ── Create lead ───────────────────────────────────────────────────
    const lead = await createLead({
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      title: payload.title,
      phone: payload.phone,
      firmName: payload.firmName,
      registrationType: payload.registrationType || "other",
      researchInterest: payload.researchInterest || "unknown",
      source: payload.source || "webhook",
      city: payload.city,
      state: payload.state,
      country: payload.country,
    });

    // Process in background (fire-and-forget)
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
