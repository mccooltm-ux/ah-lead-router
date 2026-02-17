import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { processNewLead } from "@/lib/services/routingService";

/**
 * GET /api/cron/process-leads
 *
 * Vercel Cron Job: Polls for unprocessed leads and routes them.
 * Runs every 15 minutes (configurable in vercel.json).
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    const expectedSecret = process.env.CRON_SECRET;
    if (expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find all NEW leads that haven't been processed yet
    const unprocessedLeads = await prisma.lead.findMany({
      where: {
        status: "NEW",
        assignedRepId: null,
        enrichedAt: null,
      },
      orderBy: { createdAt: "asc" },
      take: 50, // Process in batches
    });

    console.log(`[Cron] Found ${unprocessedLeads.length} unprocessed leads`);

    let processed = 0;
    let errors = 0;

    for (const lead of unprocessedLeads) {
      try {
        await processNewLead(lead.id);
        processed++;
      } catch (err) {
        console.error(`[Cron] Failed to process lead ${lead.id}:`, err);
        errors++;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        found: unprocessedLeads.length,
        processed,
        errors,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("[Cron] process-leads error:", error);
    return NextResponse.json(
      { success: false, error: "Cron job failed" },
      { status: 500 }
    );
  }
}
