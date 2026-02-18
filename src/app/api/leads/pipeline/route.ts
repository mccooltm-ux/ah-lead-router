import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/leads/pipeline â leads from past 30 days with conversion progress
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const daysBack = parseInt(searchParams.get("days") || "30");
    const statusFilter = searchParams.get("status") || undefined;
    const brandFilter = searchParams.get("brand") || undefined;
    const search = searchParams.get("search") || undefined;

    const since = new Date();
    since.setDate(since.getDate() - daysBack);

    const where: Record<string, unknown> = {
      createdAt: { gte: since },
    };

    if (statusFilter) {
      where.status = statusFilter;
    }
    if (brandFilter) {
      where.researchInterest = brandFilter;
    }
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { firmName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const leads = await prisma.lead.findMany({
      where,
      include: {
        assignedRep: { select: { id: true, name: true, email: true } },
        account: {
          select: {
            id: true,
            firmName: true,
            status: true,
            products: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const now = new Date();
    const CONVERSION_WINDOW_DAYS = 7;

    const pipelineLeads = leads.map((lead) => {
      const routedDate = lead.routedAt ? new Date(lead.routedAt) : null;
      const convertedDate = lead.convertedAt
        ? new Date(lead.convertedAt)
        : null;

      // Calculate days elapsed since routing
      let daysElapsed = 0;
      let daysRemaining = CONVERSION_WINDOW_DAYS;
      let progressPercent = 0;
      let isOverdue = false;

      if (lead.status === "CONVERTED" && convertedDate && routedDate) {
        // Converted: show how long it took
        daysElapsed = Math.ceil(
          (convertedDate.getTime() - routedDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        daysRemaining = 0;
        progressPercent = 100;
      } else if (routedDate) {
        // In progress: calculate time elapsed
        daysElapsed = Math.ceil(
          (now.getTime() - routedDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        daysRemaining = Math.max(0, CONVERSION_WINDOW_DAYS - daysElapsed);
        progressPercent = Math.min(
          100,
          Math.round((daysElapsed / CONVERSION_WINDOW_DAYS) * 100)
        );
        isOverdue = daysElapsed > CONVERSION_WINDOW_DAYS;
      }
      // NEW leads: not routed yet, progress stays at 0

      // Determine score tier
      let scoreTier: "Hot" | "Warm" | "Cool" | "Cold" = "Cold";
      if (lead.leadScore >= 75) scoreTier = "Hot";
      else if (lead.leadScore >= 50) scoreTier = "Warm";
      else if (lead.leadScore >= 25) scoreTier = "Cool";

      return {
        id: lead.id,
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email,
        title: lead.title,
        firmName: lead.firmName,
        firmType: lead.firmType,
        researchInterest: lead.researchInterest,
        leadScore: lead.leadScore,
        scoreTier,
        status: lead.status,
        territoryMatch: lead.territoryMatch,
        assignedRep: lead.assignedRep,
        account: lead.account,
        // Pipeline-specific fields
        daysElapsed,
        daysRemaining,
        progressPercent,
        isOverdue,
        conversionWindowDays: CONVERSION_WINDOW_DAYS,
        // Timestamps
        createdAt: lead.createdAt.toISOString(),
        routedAt: lead.routedAt?.toISOString() || null,
        contactedAt: lead.contactedAt?.toISOString() || null,
        convertedAt: lead.convertedAt?.toISOString() || null,
      };
    });

    // Summary stats
    const summary = {
      total: pipelineLeads.length,
      byStatus: {
        NEW: pipelineLeads.filter((l) => l.status === "NEW").length,
        ROUTED: pipelineLeads.filter((l) => l.status === "ROUTED").length,
        CONTACTED: pipelineLeads.filter((l) => l.status === "CONTACTED").length,
        CONVERTED: pipelineLeads.filter((l) => l.status === "CONVERTED").length,
        STALE: pipelineLeads.filter((l) => l.status === "STALE").length,
      },
      overdue: pipelineLeads.filter((l) => l.isOverdue).length,
      avgDaysToConvert:
        pipelineLeads.filter((l) => l.status === "CONVERTED").length > 0
          ? Math.round(
              pipelineLeads
                .filter((l) => l.status === "CONVERTED")
                .reduce((sum, l) => sum + l.daysElapsed, 0) /
                pipelineLeads.filter((l) => l.status === "CONVERTED").length
            )
          : null,
    };

    return NextResponse.json({
      success: true,
      data: { leads: pipelineLeads, summary },
    });
  } catch (error) {
    console.error("[API] GET /api/leads/pipeline error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch pipeline data" },
      { status: 500 }
    );
  }
}
