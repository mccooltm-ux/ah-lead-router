/**
 * Territory Matching & Lead Routing Service
 *
 * Determines which sales rep should own a lead based on:
 * 1. Existing account ownership (highest priority)
 * 2. Geographic territory matching
 * 3. Manual routing fallback
 */

import { prisma } from "@/lib/db";
import { getEnrichmentClient } from "@/lib/clients/enrichmentClient";
import { getCrmClient } from "@/lib/clients/crmClient";
import { getNotificationClient } from "@/lib/clients/notificationClient";
import { scoreLead } from "./scoringService";
import { matchBrand, getBrandLabel } from "@/lib/config/brands";
import type { Lead, Account, SalesRep } from "@prisma/client";

// âââ Domain Extraction âââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export function extractDomain(email: string): string {
  const parts = email.split("@");
  return parts.length > 1 ? parts[1].toLowerCase() : "";
}

// Free email providers that shouldn't be used for firm matching
const FREE_EMAIL_DOMAINS = new Set([
  "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "aol.com",
  "icloud.com", "mail.com", "protonmail.com", "live.com", "msn.com",
]);

export function isBusinessEmail(email: string): boolean {
  return !FREE_EMAIL_DOMAINS.has(extractDomain(email));
}

// âââ Account Matching ââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export async function findMatchingAccount(
  firmName: string,
  domain?: string
): Promise<(Account & { rep: SalesRep | null }) | null> {
  // Try domain match first (most reliable)
  if (domain && !FREE_EMAIL_DOMAINS.has(domain)) {
    const byDomain = await prisma.account.findFirst({
      where: { domain: { equals: domain, mode: "insensitive" } },
      include: { rep: true },
    });
    if (byDomain) return byDomain;
  }

  // Fuzzy firm name match
  const byName = await prisma.account.findFirst({
    where: {
      firmName: { contains: firmName, mode: "insensitive" },
    },
    include: { rep: true },
  });

  return byName;
}

// âââ Territory Matching ââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export async function findTerritoryRep(
  state?: string | null,
  country?: string | null
): Promise<{ rep: SalesRep; territoryName: string } | null> {
  if (!state) return null;

  const stateCode = state.toUpperCase();
  const territories = await prisma.territory.findMany({
    include: { rep: true },
  });

  for (const territory of territories) {
    if (territory.regions.includes(stateCode) && territory.rep) {
      return { rep: territory.rep, territoryName: territory.name };
    }
  }

  // Check if it's a Canadian province
  if (country === "CA" || country === "Canada") {
    const canadaTerritory = territories.find(
      (t) => t.regions.some((r) => ["ON", "BC", "AB", "QC"].includes(r)) && t.rep
    );
    if (canadaTerritory?.rep) {
      return { rep: canadaTerritory.rep, territoryName: canadaTerritory.name };
    }
  }

  return null;
}

// âââ Full Lead Processing Pipeline âââââââââââââââââââââââââââââââââââââââââââ

export async function processNewLead(leadId: string): Promise<void> {
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) throw new Error(`Lead not found: ${leadId}`);

  const domain = lead.email ? extractDomain(lead.email) : undefined;
  const enrichment = getEnrichmentClient();
  const crm = getCrmClient();
  const notifications = getNotificationClient();

  // ââ Step 1: Enrich ââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  let enrichmentData = null;
  try {
    enrichmentData = await enrichment.enrichFirm({
      domain: domain && !FREE_EMAIL_DOMAINS.has(domain) ? domain : undefined,
      firmName: lead.firmName,
    });
  } catch (err) {
    console.error(`[Routing] Enrichment failed for ${lead.firmName}:`, err);
  }

  // ââ Step 2: Account Match âââââââââââââââââââââââââââââââââââââââââââââââ
  const matchedAccount = await findMatchingAccount(lead.firmName, domain);

  // ââ Step 3: Determine location (from enrichment or existing data) ââââââ
  const city = lead.city || enrichmentData?.city || null;
  const state = lead.state || enrichmentData?.state || matchedAccount?.state || null;
  const country = lead.country || enrichmentData?.country || matchedAccount?.country || "US";
  const firmType = lead.firmType || enrichmentData?.firmType || matchedAccount?.firmType || null;
  const aum = lead.aum || enrichmentData?.aum || matchedAccount?.aum || null;

  // ââ Step 4: Find the right rep ââââââââââââââââââââââââââââââââââââââââââ
  let assignedRep: SalesRep | null = null;
  let territoryName: string | null = null;

  // Priority 1: If existing account, route to account owner
  if (matchedAccount?.rep) {
    assignedRep = matchedAccount.rep;
    territoryName = matchedAccount.territory || "Account Owner";
  }

  // Priority 2: Route by territory
  if (!assignedRep && state) {
    const territoryMatch = await findTerritoryRep(state, country);
    if (territoryMatch) {
      assignedRep = territoryMatch.rep;
      territoryName = territoryMatch.territoryName;
    }
  }

  // ââ Step 5: Score the lead ââââââââââââââââââââââââââââââââââââââââââââââ
  const scoreBreakdown = scoreLead({
    isExistingAccount: !!matchedAccount,
    firmType,
    aum,
    registrationType: lead.registrationType,
    hasTerritoryMatch: !!assignedRep,
  });

  // ââ Step 6: Match affiliate brand âââââââââââââââââââââââââââââââââââââââ
  const brandSlug = matchBrand(lead.researchInterest) || lead.researchInterest;

  // ââ Step 7: Update the lead record ââââââââââââââââââââââââââââââââââââââ
  const now = new Date();
  await prisma.lead.update({
    where: { id: leadId },
    data: {
      firmDomain: domain || lead.firmDomain,
      firmType: firmType,
      aum: aum,
      city: city,
      state: state,
      country: country,
      accountId: matchedAccount?.id || null,
      assignedRepId: assignedRep?.id || null,
      territoryMatch: territoryName,
      leadScore: scoreBreakdown.total,
      scoreBreakdown: scoreBreakdown as unknown as Record<string, unknown>,
      researchInterest: brandSlug,
      enrichmentData: enrichmentData as unknown as Record<string, unknown> | null,
      enrichedAt: enrichmentData ? now : null,
      status: assignedRep ? "ROUTED" : "NEW",
      routedAt: assignedRep ? now : null,
    },
  });

  // ââ Step 8: Record status change ââââââââââââââââââââââââââââââââââââââââ
  if (assignedRep) {
    await prisma.leadStatusChange.create({
      data: {
        leadId,
        fromStatus: "NEW",
        toStatus: "ROUTED",
        changedBy: "system",
        reason: matchedAccount
          ? `Auto-routed to account owner (${matchedAccount.firmName})`
          : `Auto-routed by territory (${territoryName})`,
      },
    });

    // ââ Step 9: CRM sync ââââââââââââââââââââââââââââââââââââââââââââââââ
    try {
      const contact = await crm.upsertContact({
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email,
      });
      await crm.addToDistributionList(contact.id, `${assignedRep.name} - Sales`);
    } catch (err) {
      console.error(`[Routing] CRM sync failed:`, err);
    }

    // ââ Step 10: Notify the rep âââââââââââââââââââââââââââââââââââââââââ
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      await notifications.sendLeadAlert({
        repName: assignedRep.name,
        repEmail: assignedRep.email,
        lead: {
          id: leadId,
          name: `${lead.firstName} ${lead.lastName}`,
          title: lead.title || undefined,
          firmName: lead.firmName,
          researchInterest: getBrandLabel(brandSlug),
          leadScore: scoreBreakdown.total,
          isExistingAccount: !!matchedAccount,
          scoreBreakdown,
        },
        dashboardUrl: `${appUrl}/leads/${leadId}`,
      });
    } catch (err) {
      console.error(`[Routing] Notification failed:`, err);
    }
  }

  console.log(
    `[Routing] Lead ${leadId} processed: score=${scoreBreakdown.total}, ` +
    `rep=${assignedRep?.name || "UNASSIGNED"}, territory=${territoryName || "NONE"}`
  );
}
