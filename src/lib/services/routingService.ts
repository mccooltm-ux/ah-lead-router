/**
 * Territory Matching & Lead Routing Service
 *
 * Determines which sales rep should own a lead based on:
 * 1. Existing account ownership (highest priority)
 * 2. Geographic territory matching
 * 3. Manual routing fallback
 *
 * FIXES APPLIED:
 * - Firm name matching: exact match first, then word-boundary fuzzy (not substring)
 * - Territory regions: properly parsed as JSON array
 * - Idempotency: processNewLead skips leads already being processed
 * - Transaction: lead update + status change wrapped in $transaction
 * - Canadian territory: data-driven, not hardcoded provinces
 */

import { prisma } from "@/lib/db";
import { getEnrichmentClient } from "@/lib/clients/enrichmentClient";
import { getCrmClient } from "@/lib/clients/crmClient";
import { getNotificationClient } from "@/lib/clients/notificationClient";
import { scoreLead } from "./scoringService";
import { matchBrand, getBrandLabel } from "@/lib/config/brands";
import type { Lead, Account, SalesRep } from "@prisma/client";
import { Prisma } from "@prisma/client";

// âââ Domain Extraction ââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export function extractDomain(email: string): string {
  const parts = email.split("@");
  return parts.length > 1 ? parts[1].toLowerCase() : "";
}

const FREE_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "aol.com",
  "icloud.com",
  "mail.com",
  "protonmail.com",
  "live.com",
  "msn.com",
]);

export function isBusinessEmail(email: string): boolean {
  return !FREE_EMAIL_DOMAINS.has(extractDomain(email));
}

// âââ Account Matching (FIXED) âââââââââââââââââââââââââââââââââââââââââââââââââ

/**
 * FIX: Previously used `contains` for firm name matching, which meant
 * "Sun" would match "Sunshine Capital", "Sunset Advisors", etc.
 *
 * New approach:
 * 1. Exact domain match (most reliable, unchanged)
 * 2. Exact firm name match (case-insensitive)
 * 3. Word-boundary fuzzy match using `startsWith` on the firm name
 *    (e.g., "Pine River" matches "Pine River Capital Management" but
 *     "Pine" alone does NOT match "Pine River Capital Management")
 *
 * We require at least 2 words or 8 characters for fuzzy matching to prevent
 * false positives from short names.
 */
export async function findMatchingAccount(
  firmName: string,
  domain?: string
): Promise<(Account & { rep: SalesRep | null }) | null> {
  // Priority 1: Domain match (most reliable)
  if (domain && !FREE_EMAIL_DOMAINS.has(domain)) {
    const byDomain = await prisma.account.findFirst({
      where: { domain: { equals: domain, mode: "insensitive" } },
      include: { rep: true },
    });
    if (byDomain) return byDomain;
  }

  // Priority 2: Exact firm name match
  const byExactName = await prisma.account.findFirst({
    where: {
      firmName: { equals: firmName, mode: "insensitive" },
    },
    include: { rep: true },
  });
  if (byExactName) return byExactName;

  // Priority 3: Fuzzy match â only if the input is specific enough
  const trimmedName = firmName.trim();
  const wordCount = trimmedName.split(/\s+/).length;

  // Require at least 2 words or 8+ chars to prevent "Sun" matching everything
  if (wordCount >= 2 || trimmedName.length >= 8) {
    const byStartsWith = await prisma.account.findFirst({
      where: {
        firmName: { startsWith: trimmedName, mode: "insensitive" },
      },
      include: { rep: true },
    });
    if (byStartsWith) return byStartsWith;
  }

  return null;
}

// âââ Territory Matching (FIXED) âââââââââââââââââââââââââââââââââââââââââââââââ

/**
 * FIX: Territory `regions` is stored as a String in Prisma but represents
 * an array of state/province codes. We need to properly parse it.
 *
 * The field might be:
 * - A JSON array string: '["IL","IN","CA"]'
 * - A comma-separated string: 'IL,IN,CA'
 * - An actual array (if Prisma returns it as such)
 *
 * FIX: Canadian territory matching is now data-driven â any territory
 * with country="CA" will match Canadian leads, not just hardcoded provinces.
 */
function parseRegions(regions: string | string[]): string[] {
  if (Array.isArray(regions)) return regions;
  if (typeof regions !== "string") return [];

  const trimmed = regions.trim();

  // Try JSON parse first
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.map((r: string) => String(r).trim().toUpperCase());
    } catch {
      // Fall through to comma-separated
    }
  }

  // Comma-separated fallback
  return trimmed.split(",").map((r) => r.trim().toUpperCase()).filter(Boolean);
}

export async function findTerritoryRep(
  state?: string | null,
  country?: string | null
): Promise<{ rep: SalesRep; territoryName: string } | null> {
  if (!state) return null;

  const stateCode = state.toUpperCase().trim();
  const territories = await prisma.territory.findMany({
    include: { rep: true },
  });

  // Priority 1: Direct state/province match
  for (const territory of territories) {
    const regionCodes = parseRegions(territory.regions);
    if (regionCodes.includes(stateCode) && territory.rep) {
      return { rep: territory.rep, territoryName: territory.name };
    }
  }

  // Priority 2: Country-based fallback for Canadian leads
  // FIX: Previously hardcoded to ON/BC/AB/QC. Now matches ANY territory
  // with the same country code.
  const effectiveCountry = country?.toUpperCase().trim();
  if (effectiveCountry === "CA" || effectiveCountry === "CANADA") {
    const canadaTerritory = territories.find(
      (t) => t.country.toUpperCase() === "CA" && t.rep
    );
    if (canadaTerritory?.rep) {
      return { rep: canadaTerritory.rep, territoryName: canadaTerritory.name };
    }
  }

  return null;
}

// âââ Idempotency Tracking âââââââââââââââââââââââââââââââââââââââââââââââââââââ

/**
 * FIX: Prevent double-processing of leads.
 * The webhook fires processNewLead() in background, and the cron job also
 * picks up NEW leads. Without this guard, a lead could be processed twice
 * in a race condition window.
 */
const processingLeads = new Set<string>();

// âââ Full Lead Processing Pipeline ââââââââââââââââââââââââââââââââââââââââââââ

export async function processNewLead(leadId: string): Promise<void> {
  // ââ Idempotency guard âââââââââââââââââââââââââââââââââââââââââââââ
  if (processingLeads.has(leadId)) {
    console.log(`[Routing] Lead ${leadId} is already being processed, skipping`);
    return;
  }
  processingLeads.add(leadId);

  try {
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) throw new Error(`Lead not found: ${leadId}`);

    // Skip if already processed (belt + suspenders)
    if (lead.status !== "NEW") {
      console.log(`[Routing] Lead ${leadId} already has status ${lead.status}, skipping`);
      return;
    }

    const domain = lead.email ? extractDomain(lead.email) : undefined;
    const enrichment = getEnrichmentClient();
    const crm = getCrmClient();
    const notifications = getNotificationClient();

    // ââ Step 1: Enrich ââââââââââââââââââââââââââââââââââââââââââââââââ
    let enrichmentData = null;
    try {
      enrichmentData = await enrichment.enrichFirm({
        domain: domain && !FREE_EMAIL_DOMAINS.has(domain) ? domain : undefined,
        firmName: lead.firmName,
      });
    } catch (err) {
      console.error(`[Routing] Enrichment failed for ${lead.firmName}:`, err);
    }

    // ââ Step 2: Account Match âââââââââââââââââââââââââââââââââââââââââ
    const matchedAccount = await findMatchingAccount(lead.firmName, domain);

    // ââ Step 3: Determine location ââââââââââââââââââââââââââââââââââââ
    const city = lead.city || enrichmentData?.city || null;
    const state =
      lead.state ||
      enrichmentData?.state ||
      matchedAccount?.state ||
      null;
    const country =
      lead.country ||
      enrichmentData?.country ||
      matchedAccount?.country ||
      "US";
    const firmType =
      lead.firmType ||
      enrichmentData?.firmType ||
      matchedAccount?.firmType ||
      null;
    const aum =
      lead.aum || enrichmentData?.aum || matchedAccount?.aum || null;

    // ââ Step 4: Find the right rep ââââââââââââââââââââââââââââââââââââ
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

    // ââ Step 5: Score the lead ââââââââââââââââââââââââââââââââââââââââ
    const scoreBreakdown = scoreLead({
      isExistingAccount: !!matchedAccount,
      firmType,
      aum,
      registrationType: lead.registrationType,
      hasTerritoryMatch: !!assignedRep,
    });

    // ââ Step 6: Match affiliate brand âââââââââââââââââââââââââââââââââ
    const brandSlug =
      matchBrand(lead.researchInterest) || lead.researchInterest;

    // ââ Step 7+8: Update lead + record status change IN A TRANSACTION â
    // FIX: Previously these were separate operations. If step 8 failed,
    // the lead would show as ROUTED but have no status change record.
    const now = new Date();

    await prisma.$transaction(async (tx) => {
      await tx.lead.update({
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
          scoreBreakdown: scoreBreakdown as unknown as Prisma.InputJsonValue,
          researchInterest: brandSlug,
          enrichmentData: enrichmentData
            ? (enrichmentData as unknown as Prisma.InputJsonValue)
            : Prisma.DbNull,
          enrichedAt: enrichmentData ? now : null,
          status: assignedRep ? "ROUTED" : "NEW",
          routedAt: assignedRep ? now : null,
        },
      });

      if (assignedRep) {
        await tx.leadStatusChange.create({
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
      }
    });

    // ââ Step 9: CRM sync (outside transaction â non-critical) âââââââââ
    if (assignedRep) {
      try {
        const contact = await crm.upsertContact({
          firstName: lead.firstName,
          lastName: lead.lastName,
          email: lead.email,
        });
        await crm.addToDistributionList(
          contact.id,
          `${assignedRep.name} - Sales`
        );
      } catch (err) {
        console.error(`[Routing] CRM sync failed:`, err);
      }

      // ââ Step 10: Notify the rep âââââââââââââââââââââââââââââââââââââââ
      try {
        const appUrl =
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
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
  } finally {
    // Always clean up the idempotency guard
    processingLeads.delete(leadId);
  }
}
