import { NextRequest, NextResponse } from "next/server";
import { leadRepo } from "@/lib/db";
import { ensureSeeded } from "@/lib/auto-seed";
import type { LeadFilters } from "@/types";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    await ensureSeeded();

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "25");
    const search = searchParams.get("search") || "";
    const statusParam = searchParams.get("status");
    const franchiseParam = searchParams.get("franchise");
    const tierParam = searchParams.get("tier");

    const filters: LeadFilters = {
      page,
      limit,
      search: search || undefined,
      status: statusParam ? (statusParam.split(",") as any[]) : undefined,
      franchise: franchiseParam ? franchiseParam.split(",") : undefined,
      tier: tierParam ? tierParam.split(",") : undefined,
    };

    const result = leadRepo.getFiltered(filters);

    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (error) {
    console.error("Error fetching leads:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch leads" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.name || !body.email) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: name, email" },
        { status: 400 }
      );
    }

    const newLead = leadRepo.create({
      name: body.name,
      email: body.email,
      title: body.title || "",
      firm: body.firm || "",
      phone: body.phone || null,
      source: body.source || "manual",
      status: body.status || "new",
      franchise: body.franchise || null,
      tier: body.tier || null,
      notes: body.notes || null,
    });

    return NextResponse.json({ success: true, data: newLead }, { status: 201 });
  } catch (error) {
    console.error("Error creating lead:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create lead" },
      { status: 500 }
    );
  }
}
