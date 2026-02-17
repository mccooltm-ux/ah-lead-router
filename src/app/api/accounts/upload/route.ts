import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import Papa from "papaparse";

/**
 * POST /api/accounts/upload â upload a CSV file of accounts
 *
 * Accepts multipart form data with a CSV file.
 * Expected CSV columns: firm_name, domain, rep_owner, territory, status, city, state, country, firm_type, aum, products
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file uploaded" },
        { status: 400 }
      );
    }

    const csvText = await file.text();
    const parsed = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h: string) => h.trim().toLowerCase().replace(/\s+/g, "_"),
    });

    if (parsed.errors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "CSV parsing errors",
          data: { errors: parsed.errors.slice(0, 5) },
        },
        { status: 400 }
      );
    }

    const rows = parsed.data as Record<string, string>[];
    let imported = 0;
    let skipped = 0;

    for (const row of rows) {
      const firmName = row.firm_name || row.firmname || row.name;
      if (!firmName) {
        skipped++;
        continue;
      }

      // Find matching rep
      let repId: string | null = null;
      const repOwner = row.rep_owner || row.repowner || row.rep;
      if (repOwner) {
        const rep = await prisma.salesRep.findFirst({
          where: { name: { contains: repOwner, mode: "insensitive" } },
        });
        repId = rep?.id || null;
      }

      const slug = firmName.toLowerCase().replace(/[^a-z0-9]+/g, "-");

      await prisma.account.upsert({
        where: { id: `csv-${slug}` },
        create: {
          id: `csv-${slug}`,
          firmName,
          domain: row.domain || null,
          territory: row.territory || null,
          repId,
          status: row.status || "active",
          city: row.city || null,
          state: row.state || null,
          country: row.country || "US",
          firmType: row.firm_type || row.firmtype || null,
          aum: row.aum ? parseFloat(row.aum) : null,
          products: row.products ? row.products.split(";").map((p: string) => p.trim()) : [],
        },
        update: {
          domain: row.domain || undefined,
          territory: row.territory || undefined,
          repId: repId || undefined,
        },
      });
      imported++;
    }

    return NextResponse.json({
      success: true,
      data: { imported, skipped, total: rows.length },
      message: `Successfully imported ${imported} accounts`,
    });
  } catch (error) {
    console.error("[API] POST /api/accounts/upload error:", error);
    return NextResponse.json(
      { success: false, error: "CSV upload failed" },
      { status: 500 }
    );
  }
}
