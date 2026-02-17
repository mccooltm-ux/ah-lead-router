// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { processNewLead } from "@/lib/services/routingService";
import {
  DEFAULT_TERRITORIES,
  MIDWEST_STATES,
  WEST_COAST_STATES,
  CANADIAN_PROVINCES,
  EAST_COAST_STATES,
  SOUTHEAST_STATES,
  MOUNTAIN_STATES,
} from "@/lib/config/territories";

export const maxDuration = 60; // allow longer execution for seeding

/**
 * POST /api/demo/seed ÃÂ¢ÃÂÃÂ populate the database with realistic sample data
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const reset = body.reset !== false; // default: wipe and reseed

    if (reset) {
      // Clear existing data in correct order
      await prisma.leadNote.deleteMany();
      await prisma.leadStatusChange.deleteMany();
      await prisma.lead.deleteMany();
      await prisma.account.deleteMany();
      await prisma.territory.deleteMany();
      await prisma.salesRep.deleteMany();
    }

    // ÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂ 1. Create Sales Reps ÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂ
    const reps = await Promise.all([
      prisma.salesRep.create({
        data: {
          name: "Ted McCool",
          email: "ted@analysthub.com",
          role: "rep",
        },
      }),
      prisma.salesRep.create({
        data: {
          name: "Sarah Chen",
          email: "sarah@analysthub.com",
          role: "rep",
        },
      }),
      prisma.salesRep.create({
        data: {
          name: "Marcus Johnson",
          email: "marcus@analysthub.com",
          role: "rep",
        },
      }),
      prisma.salesRep.create({
        data: {
          name: "Lisa Rodriguez",
          email: "lisa@analysthub.com",
          role: "rep",
        },
      }),
    ]);

    const [ted, sarah, marcus, lisa] = reps;

    // ÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂ 2. Create Territories ÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂ
    const repMap: Record<string, string> = {
      "Ted McCool": ted.id,
      "Sarah Chen": sarah.id,
      "Marcus Johnson": marcus.id,
      "Lisa Rodriguez": lisa.id,
    };

    await Promise.all(
      DEFAULT_TERRITORIES.map((t) =>
        prisma.territory.create({
          data: {
            name: t.name,
            regions: t.regions,
            country: t.country,
            repId: repMap[t.repName] || null,
          },
        })
      )
    );

    // ÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂ 3. Create Sample Accounts ÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂ
    const accountData = [
      // Ted's territory (Midwest)
      { firmName: "Logos Global Management", domain: "logosglobal.com", state: "IL", city: "Chicago", country: "US", repId: ted.id, territory: "Midwest + Canada + West Coast", firmType: "hedge_fund", aum: 3200, products: ["FFTT", "Sankey"], status: "active" },
      { firmName: "Pine River Capital Management", domain: "pinerivercap.com", state: "MN", city: "Minneapolis", country: "US", repId: ted.id, territory: "Midwest + Canada + West Coast", firmType: "hedge_fund", aum: 6800, products: ["LightShed", "FFTT"], status: "active" },
      { firmName: "Walleye Capital", domain: "walleyecapital.com", state: "MN", city: "Minneapolis", country: "US", repId: ted.id, territory: "Midwest + Canada + West Coast", firmType: "hedge_fund", aum: 4500, products: ["Sankey", "IronAdvisor"], status: "active" },
      { firmName: "Citadel Securities", domain: "citadelsecurities.com", state: "IL", city: "Chicago", country: "US", repId: ted.id, territory: "Midwest + Canada + West Coast", firmType: "hedge_fund", aum: 62000, products: ["FFTT", "Sankey", "LightShed"], status: "active" },
      { firmName: "Ariel Investments", domain: "arielinvestments.com", state: "IL", city: "Chicago", country: "US", repId: ted.id, territory: "Midwest + Canada + West Coast", firmType: "asset_manager", aum: 17800, products: ["Optimal"], status: "active" },
      { firmName: "Balyasny Asset Management", domain: "bam.com", state: "IL", city: "Chicago", country: "US", repId: ted.id, territory: "Midwest + Canada + West Coast", firmType: "hedge_fund", aum: 21000, products: ["FFTT", "Fermium"], status: "active" },
      { firmName: "Midwest State Pension Fund", domain: "midwestpension.org", state: "OH", city: "Columbus", country: "US", repId: ted.id, territory: "Midwest + Canada + West Coast", firmType: "pension", aum: 28000, products: ["FFTT"], status: "active" },
      // Ted's territory (West Coast)
      { firmName: "Bluefin Capital Partners", domain: "bluefincap.com", state: "CA", city: "San Francisco", country: "US", repId: ted.id, territory: "Midwest + Canada + West Coast", firmType: "hedge_fund", aum: 1500, products: ["LightShed", "Cannonball"], status: "active" },
      { firmName: "Granite Point Capital", domain: "granitepoint.com", state: "CA", city: "Los Angeles", country: "US", repId: ted.id, territory: "Midwest + Canada + West Coast", firmType: "family_office", aum: 800, products: ["Sankey"], status: "active" },
      { firmName: "Pacific Heights Capital", domain: "pacificheights.com", state: "CA", city: "San Francisco", country: "US", repId: ted.id, territory: "Midwest + Canada + West Coast", firmType: "hedge_fund", aum: 2800, products: ["GLJ", "Schneider"], status: "active" },
      { firmName: "Cascade Investment Group", domain: "cascadeinvest.com", state: "WA", city: "Seattle", country: "US", repId: ted.id, territory: "Midwest + Canada + West Coast", firmType: "family_office", aum: 5200, products: ["FFTT", "Sankey"], status: "active" },
      // Ted's territory (Canada)
      { firmName: "Crescent Capital Group", domain: "crescentcap.ca", state: "ON", city: "Toronto", country: "CA", repId: ted.id, territory: "Midwest + Canada + West Coast", firmType: "asset_manager", aum: 2100, products: ["Sankey", "Schneider"], status: "active" },
      { firmName: "Bay Street Asset Management", domain: "baystreetam.ca", state: "ON", city: "Toronto", country: "CA", repId: ted.id, territory: "Midwest + Canada + West Coast", firmType: "asset_manager", aum: 5500, products: ["FFTT", "HJones"], status: "active" },
      { firmName: "Alberta Investment Management", domain: "aimco.ca", state: "AB", city: "Edmonton", country: "CA", repId: ted.id, territory: "Midwest + Canada + West Coast", firmType: "pension", aum: 120000, products: ["Sankey", "GLJ", "FFTT"], status: "active" },
      // Sarah's territory (East Coast)
      { firmName: "Summit View Partners", domain: "summitviewpartners.com", state: "NY", city: "New York", country: "US", repId: sarah.id, territory: "East Coast", firmType: "asset_manager", aum: 12000, products: ["FFTT", "Optimal"], status: "active" },
      { firmName: "Bridgewater Associates", domain: "bridgewater.com", state: "CT", city: "Westport", country: "US", repId: sarah.id, territory: "East Coast", firmType: "hedge_fund", aum: 124000, products: ["FFTT", "Sankey", "Fermium"], status: "active" },
      { firmName: "Point72 Asset Management", domain: "point72.com", state: "CT", city: "Stamford", country: "US", repId: sarah.id, territory: "East Coast", firmType: "hedge_fund", aum: 34000, products: ["LightShed", "Cannonball", "Optimal"], status: "active" },
      { firmName: "Two Sigma Investments", domain: "twosigma.com", state: "NY", city: "New York", country: "US", repId: sarah.id, territory: "East Coast", firmType: "hedge_fund", aum: 67000, products: ["FFTT"], status: "active" },
      { firmName: "Tudor Investment Corp", domain: "tudorinvestment.com", state: "CT", city: "Greenwich", country: "US", repId: sarah.id, territory: "East Coast", firmType: "hedge_fund", aum: 11500, products: ["FFTT", "Sankey"], status: "active" },
      { firmName: "Boston Capital Partners", domain: "bostoncap.com", state: "MA", city: "Boston", country: "US", repId: sarah.id, territory: "East Coast", firmType: "asset_manager", aum: 8200, products: ["Fermium", "IronAdvisor"], status: "active" },
      // Marcus's territory (Southeast)
      { firmName: "Peachtree Advisors", domain: "peachtreeadvisors.com", state: "GA", city: "Atlanta", country: "US", repId: marcus.id, territory: "Southeast", firmType: "ria", aum: 450, products: ["Optimal", "Rubinson"], status: "active" },
      { firmName: "Southern Oak Capital", domain: "southernoakcap.com", state: "FL", city: "Miami", country: "US", repId: marcus.id, territory: "Southeast", firmType: "hedge_fund", aum: 1800, products: ["Sankey"], status: "active" },
      { firmName: "Palmetto Wealth Management", domain: "palmettowm.com", state: "SC", city: "Charleston", country: "US", repId: marcus.id, territory: "Southeast", firmType: "ria", aum: 320, products: ["FFTT", "Optimal"], status: "active" },
      // Lisa's territory (Mountain/Central)
      { firmName: "Red Rock Capital", domain: "redrockcap.com", state: "CO", city: "Denver", country: "US", repId: lisa.id, territory: "Mountain / Central", firmType: "hedge_fund", aum: 950, products: ["Sankey", "GLJ"], status: "active" },
      { firmName: "Lone Star Investments", domain: "lonestarinvest.com", state: "TX", city: "Dallas", country: "US", repId: lisa.id, territory: "Mountain / Central", firmType: "asset_manager", aum: 7600, products: ["Sankey", "Schneider"], status: "active" },
      { firmName: "Permian Basin Capital", domain: "permianbasincap.com", state: "TX", city: "Houston", country: "US", repId: lisa.id, territory: "Mountain / Central", firmType: "hedge_fund", aum: 2200, products: ["Sankey", "Schneider"], status: "active" },
    ];

    const accounts = await Promise.all(
      accountData.map((a) =>
        prisma.account.create({ data: a })
      )
    );

    // ÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂ 4. Create Sample Leads ÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂ
    const now = new Date();
    const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000);
    const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600000);

    const leadData = [
      // ÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂ Brand new leads (status: NEW) ÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂ
      { firstName: "James", lastName: "Park", email: "jpark@horizoncap.com", title: "Senior Analyst", firmName: "Horizon Capital Advisors", registrationType: "trial", researchInterest: "sankey", city: "Chicago", state: "IL", country: "US", createdAt: hoursAgo(2) },
      { firstName: "Olivia", lastName: "Chen", email: "ochen@mapleridge.ca", title: "Portfolio Manager", firmName: "Maple Ridge Investments", registrationType: "sample_report", researchInterest: "fftt", city: "Vancouver", state: "BC", country: "CA", createdAt: hoursAgo(5) },
      { firstName: "Hassan", lastName: "Ali", email: "hali@frontierfunds.com", title: "Research Director", firmName: "Frontier Funds", registrationType: "webinar", researchInterest: "lightshed", city: "Phoenix", state: "AZ", country: "US", createdAt: hoursAgo(8) },
      { firstName: "Emma", lastName: "Watson", email: "ewatson@gmail.com", title: "Independent Analyst", firmName: "Watson Research", registrationType: "newsletter", researchInterest: "optimal", createdAt: hoursAgo(1) },

      // ÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂ Routed leads (recently assigned, awaiting contact) ÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂ
      { firstName: "David", lastName: "Kim", email: "dkim@logosglobal.com", title: "VP Research", firmName: "Logos Global Management", registrationType: "trial", researchInterest: "fftt", city: "Chicago", state: "IL", country: "US", createdAt: daysAgo(2), status: "ROUTED" as const, assignedRepId: ted.id, accountId: accounts.find(a => a.domain === "logosglobal.com")?.id, routedAt: daysAgo(2), territoryMatch: "Midwest + Canada + West Coast", leadScore: 85 },
      { firstName: "Jennifer", lastName: "Nguyen", email: "jnguyen@summitviewpartners.com", title: "Analyst", firmName: "Summit View Partners", registrationType: "sample_report", researchInterest: "optimal", city: "New York", state: "NY", country: "US", createdAt: daysAgo(1), status: "ROUTED" as const, assignedRepId: sarah.id, accountId: accounts.find(a => a.domain === "summitviewpartners.com")?.id, routedAt: daysAgo(1), territoryMatch: "East Coast", leadScore: 78 },
      { firstName: "Michael", lastName: "Brown", email: "mbrown@alpinecap.com", title: "Portfolio Manager", firmName: "Alpine Capital LLC", registrationType: "trial", researchInterest: "glj", city: "Seattle", state: "WA", country: "US", createdAt: daysAgo(3), status: "ROUTED" as const, assignedRepId: ted.id, routedAt: daysAgo(3), territoryMatch: "Midwest + Canada + West Coast", leadScore: 62 },
      { firstName: "Ana", lastName: "Morales", email: "amorales@crescentcap.ca", title: "Senior PM", firmName: "Crescent Capital Group", registrationType: "trial", researchInterest: "schneider", city: "Toronto", state: "ON", country: "CA", createdAt: daysAgo(1), status: "ROUTED" as const, assignedRepId: ted.id, accountId: accounts.find(a => a.domain === "crescentcap.ca")?.id, routedAt: daysAgo(1), territoryMatch: "Midwest + Canada + West Coast", leadScore: 72 },

      // ÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂ Contacted leads ÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂ
      { firstName: "Robert", lastName: "Williams", email: "rwilliams@walleyecapital.com", title: "CIO", firmName: "Walleye Capital", registrationType: "trial", researchInterest: "ironadvisor", city: "Minneapolis", state: "MN", country: "US", createdAt: daysAgo(10), status: "CONTACTED" as const, assignedRepId: ted.id, accountId: accounts.find(a => a.domain === "walleyecapital.com")?.id, routedAt: daysAgo(10), contactedAt: daysAgo(8), territoryMatch: "Midwest + Canada + West Coast", leadScore: 90 },
      { firstName: "Sarah", lastName: "Lee", email: "slee@southernoakcap.com", title: "Analyst", firmName: "Southern Oak Capital", registrationType: "sample_report", researchInterest: "sankey", city: "Miami", state: "FL", country: "US", createdAt: daysAgo(7), status: "CONTACTED" as const, assignedRepId: marcus.id, accountId: accounts.find(a => a.domain === "southernoakcap.com")?.id, routedAt: daysAgo(7), contactedAt: daysAgo(5), territoryMatch: "Southeast", leadScore: 68 },
      { firstName: "Kevin", lastName: "Patel", email: "kpatel@lonestarinvest.com", title: "Research Analyst", firmName: "Lone Star Investments", registrationType: "webinar", researchInterest: "schneider", city: "Dallas", state: "TX", country: "US", createdAt: daysAgo(12), status: "CONTACTED" as const, assignedRepId: lisa.id, accountId: accounts.find(a => a.domain === "lonestarinvest.com")?.id, routedAt: daysAgo(12), contactedAt: daysAgo(9), territoryMatch: "Mountain / Central", leadScore: 75 },

      // ÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂ Converted leads ÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂ
      { firstName: "Tom", lastName: "Garcia", email: "tgarcia@bluefincap.com", title: "Managing Partner", firmName: "Bluefin Capital Partners", registrationType: "trial", researchInterest: "lightshed", city: "San Francisco", state: "CA", country: "US", createdAt: daysAgo(30), status: "CONVERTED" as const, assignedRepId: ted.id, accountId: accounts.find(a => a.domain === "bluefincap.com")?.id, routedAt: daysAgo(30), contactedAt: daysAgo(28), convertedAt: daysAgo(15), territoryMatch: "Midwest + Canada + West Coast", leadScore: 82 },
      { firstName: "Michelle", lastName: "Taylor", email: "mtaylor@bostoncap.com", title: "Director of Research", firmName: "Boston Capital Partners", registrationType: "trial", researchInterest: "fermium", city: "Boston", state: "MA", country: "US", createdAt: daysAgo(25), status: "CONVERTED" as const, assignedRepId: sarah.id, accountId: accounts.find(a => a.domain === "bostoncap.com")?.id, routedAt: daysAgo(25), contactedAt: daysAgo(23), convertedAt: daysAgo(14), territoryMatch: "East Coast", leadScore: 76 },
      { firstName: "Chris", lastName: "Anderson", email: "canderson@redrockcap.com", title: "PM", firmName: "Red Rock Capital", registrationType: "sample_report", researchInterest: "glj", city: "Denver", state: "CO", country: "US", createdAt: daysAgo(20), status: "CONVERTED" as const, assignedRepId: lisa.id, accountId: accounts.find(a => a.domain === "redrockcap.com")?.id, routedAt: daysAgo(20), contactedAt: daysAgo(18), convertedAt: daysAgo(10), territoryMatch: "Mountain / Central", leadScore: 70 },

      // ÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂ Stale leads (routed but no action) ÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂ
      { firstName: "Brian", lastName: "Thompson", email: "bthompson@greatlakes.com", title: "Analyst", firmName: "Great Lakes Investment Co", registrationType: "trial", researchInterest: "hjones", city: "Detroit", state: "MI", country: "US", createdAt: daysAgo(12), status: "STALE" as const, assignedRepId: ted.id, routedAt: daysAgo(12), staleAt: daysAgo(5), territoryMatch: "Midwest + Canada + West Coast", leadScore: 55 },
      { firstName: "Rachel", lastName: "Green", email: "rgreen@coastalcap.com", title: "Junior Analyst", firmName: "Coastal Capital", registrationType: "newsletter", researchInterest: "lightshed", city: "Tampa", state: "FL", country: "US", createdAt: daysAgo(15), status: "STALE" as const, assignedRepId: marcus.id, routedAt: daysAgo(15), staleAt: daysAgo(8), territoryMatch: "Southeast", leadScore: 35 },
      { firstName: "Alex", lastName: "Dubois", email: "adubois@quebecfund.ca", title: "Portfolio Manager", firmName: "Quebec Growth Fund", registrationType: "trial", researchInterest: "fftt", city: "Montreal", state: "QC", country: "CA", createdAt: daysAgo(10), status: "STALE" as const, assignedRepId: ted.id, routedAt: daysAgo(10), staleAt: daysAgo(3), territoryMatch: "Midwest + Canada + West Coast", leadScore: 65 },
    ];

    const leads: any[] = [];
    for (const ld of leadData) {
      const { status, assignedRepId, accountId, routedAt, contactedAt, convertedAt, staleAt, leadScore, territoryMatch, ...createData } = ld;
      const lead = await prisma.lead.create({
        data: {
          ...createData,
          status: status || "NEW",
          assignedRepId: assignedRepId || null,
          accountId: accountId || null,
          routedAt: routedAt || null,
          contactedAt: contactedAt || null,
          convertedAt: convertedAt || null,
          staleAt: staleAt || null,
          leadScore: leadScore || 0,
          territoryMatch: territoryMatch || null,
        },
      });
      leads.push(lead);

      // Add status change history for non-NEW leads
      if (status && status !== "NEW") {
        await prisma.leadStatusChange.create({
          data: {
            leadId: lead.id,
            fromStatus: "NEW",
            toStatus: "ROUTED",
            changedBy: "system",
            reason: "Auto-routed by territory",
            createdAt: routedAt || lead.createdAt,
          },
        });

        if (status === "CONTACTED" || status === "CONVERTED") {
          await prisma.leadStatusChange.create({
            data: {
              leadId: lead.id,
              fromStatus: "ROUTED",
              toStatus: "CONTACTED",
              changedBy: assignedRepId ? "rep" : "system",
              reason: "Rep initiated outreach",
              createdAt: contactedAt || daysAgo(5),
            },
          });
        }

        if (status === "CONVERTED") {
          await prisma.leadStatusChange.create({
            data: {
              leadId: lead.id,
              fromStatus: "CONTACTED",
              toStatus: "CONVERTED",
              changedBy: "rep",
              reason: "Subscription confirmed",
              createdAt: convertedAt || daysAgo(2),
            },
          });
        }

        if (status === "STALE") {
          await prisma.leadStatusChange.create({
            data: {
              leadId: lead.id,
              fromStatus: "ROUTED",
              toStatus: "STALE",
              changedBy: "system",
              reason: "No action for 5+ business days",
              createdAt: staleAt || daysAgo(3),
            },
          });
        }
      }
    }

    // Add some sample notes
    const routedLeads = leads.filter(l => leadData[leads.indexOf(l)]?.status === "CONTACTED" || leadData[leads.indexOf(l)]?.status === "CONVERTED");
    for (const lead of routedLeads) {
      await prisma.leadNote.create({
        data: {
          leadId: lead.id,
          author: "System",
          content: "Lead auto-enriched with firmographic data from BigDough.",
          createdAt: lead.createdAt,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        reps: reps.length,
        territories: DEFAULT_TERRITORIES.length,
        accounts: accounts.length,
        leads: leads.length,
      },
      message: "Demo data seeded successfully",
    });
  } catch (error) {
    console.error("[Seed] Error:", error);
    return NextResponse.json(
      { success: false, error: `Seeding failed: ${error}` },
      { status: 500 }
    );
  }
}
