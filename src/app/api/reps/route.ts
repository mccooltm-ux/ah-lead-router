import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/reps â list all sales reps
export async function GET() {
  try {
    const reps = await prisma.salesRep.findMany({
      where: { active: true },
      include: {
        _count: { select: { leads: true, territories: true, accounts: true } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, data: reps });
  } catch (error) {
    console.error("[API] GET /api/reps error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch reps" },
      { status: 500 }
    );
  }
}
