import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/accounts â list all accounts
export async function GET() {
  try {
    const accounts = await prisma.account.findMany({
      include: {
        rep: { select: { id: true, name: true, email: true } },
        _count: { select: { leads: true } },
      },
      orderBy: { firmName: "asc" },
    });

    return NextResponse.json({ success: true, data: accounts });
  } catch (error) {
    console.error("[API] GET /api/accounts error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch accounts" },
      { status: 500 }
    );
  }
}
