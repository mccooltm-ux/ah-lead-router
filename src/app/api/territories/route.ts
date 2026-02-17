import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/territories â list all territories with reps
export async function GET() {
  try {
    const territories = await prisma.territory.findMany({
      include: {
        rep: { select: { id: true, name: true, email: true } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, data: territories });
  } catch (error) {
    console.error("[API] GET /api/territories error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch territories" },
      { status: 500 }
    );
  }
}

// PUT /api/territories â update territory-rep assignment
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { territoryId, repId } = body;

    if (!territoryId) {
      return NextResponse.json(
        { success: false, error: "territoryId is required" },
        { status: 400 }
      );
    }

    const territory = await prisma.territory.update({
      where: { id: territoryId },
      data: { repId: repId || null },
      include: {
        rep: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ success: true, data: territory });
  } catch (error) {
    console.error("[API] PUT /api/territories error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update territory" },
      { status: 500 }
    );
  }
}
