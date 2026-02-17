import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * POST /api/accounts/import â import accounts from JSON array
 *
 * Expected payload:
 * {
 *   "accounts": [
 *     { "firmName": "Acme Capital", "domain": "acmecap.com", "repOwner": "Ted McCool", "territory": "Midwest", "state": "IL", "country": "US", "firmType": "hedge_fund", "aum": 1200, "products": ["Sankey", "FFTT"] }
 *   ]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const accounts = body.accounts;

    if (!Array.isArray(accounts) || accounts.length === 0) {
      return NextResponse.json(
        { success: false, error: "accounts array is required" },
        { status: 400 }
      );
    }

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const acct of accounts) {
      try {
        if (!acct.firmName) {
          skipped++;
          continue;
        }

        // Find matching rep
        let repId: string | null = null;
        if (acct.repOwner) {
          const rep = await prisma.salesRep.findFirst({
            where: { name: { contains: acct.repOwner, mode: "insensitive" } },
          });
          repId = rep?.id || null;
        }

        // Upsert the account
        await prisma.account.upsert({
          where: {
            id: acct.id || `import-${acct.firmName.toLowerCase().replace(/\s+/g, "-")}`,
          },
          create: {
            firmName: acct.firmName,
            domain: acct.domain || null,
            territory: acct.territory || null,
            repId,
            status: acct.status || "active",
            city: acct.city || null,
            state: acct.state || null,
            country: acct.country || "US",
            firmType: acct.firmType || null,
            aum: acct.aum || null,
            products: acct.products || [],
          },
          update: {
            domain: acct.domain || undefined,
            territory: acct.territory || undefined,
            repId: repId || undefined,
            firmType: acct.firmType || undefined,
            aum: acct.aum || undefined,
            products: acct.products || undefined,
          },
        });
        imported++;
      } catch (err) {
        errors.push(`Failed to import ${acct.firmName}: ${err}`);
        skipped++;
      }
    }

    return NextResponse.json({
      success: true,
      data: { imported, skipped, errors: errors.slice(0, 10) },
    });
  } catch (error) {
    console.error("[API] POST /api/accounts/import error:", error);
    return NextResponse.json(
      { success: false, error: "Import failed" },
      { status: 500 }
    );
  }
}
