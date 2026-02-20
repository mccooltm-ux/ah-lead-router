import { NextResponse } from "next/server";
import { leadRepo } from "@/lib/db";
import { ensureSeeded } from "@/lib/auto-seed";

export const runtime = "nodejs";

export async function GET() {
  try {
    // Ensure demo data is seeded on first request
    await ensureSeeded();

    const stats = leadRepo.getStats();

    return NextResponse.json(
      {
        success: true,
        data: stats,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch stats",
      },
      { status: 500 }
    );
  }
}
