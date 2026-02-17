import { NextResponse } from "next/server";
import { getDashboardStats, getConversionMetrics } from "@/lib/services/conversionService";

// GET /api/stats â dashboard statistics
export async function GET() {
  try {
    const [stats, metrics] = await Promise.all([
      getDashboardStats(),
      getConversionMetrics(),
    ]);

    return NextResponse.json({
      success: true,
      data: { ...stats, conversionMetrics: metrics },
    });
  } catch (error) {
    console.error("[API] GET /api/stats error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
