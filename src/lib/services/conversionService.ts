/**
 * Conversion Tracking Service
 *
 * Manages lead lifecycle, stale detection, auto-escalation,
 * and conversion metrics.
 */

import { prisma } from "@/lib/db";
import { getNotificationClient } from "@/lib/clients/notificationClient";
import { differenceInBusinessDays, differenceInHours, subDays, startOfWeek, startOfMonth } from "date-fns";
import type { LeadStatus } from "@prisma/client";
import type { DashboardStats, LeadStatusType } from "@/lib/types";

// âââ Status Transitions âââââââââââââââââââââââââââââââââââââââââââââââââââââ

const VALID_TRANSITIONS: Record<string, LeadStatus[]> = {
  NEW: ["ROUTED", "STALE"],
  ROUTED: ["CONTACTED", "STALE"],
  CONTACTED: ["CONVERTED", "STALE"],
  CONVERTED: [],
  STALE: ["ROUTED", "CONTACTED"], // can be revived
};

export async function updateLeadStatus(
  leadId: string,
  newStatus: LeadStatus,
  changedBy: string = "system",
  reason?: string
): Promise<void> {
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) throw new Error(`Lead not found: ${leadId}`);

  const validNext = VALID_TRANSITIONS[lead.status];
  if (!validNext?.includes(newStatus)) {
    throw new Error(`Invalid transition: ${lead.status} â ${newStatus}`);
  }

  const now = new Date();
  const updateData: Record<string, unknown> = {
    status: newStatus,
    updatedAt: now,
  };

  if (newStatus === "ROUTED") updateData.routedAt = lead.routedAt || now;
  if (newStatus === "CONTACTED") updateData.contactedAt = now;
  if (newStatus === "CONVERTED") updateData.convertedAt = now;
  if (newStatus === "STALE") updateData.staleAt = now;

  await prisma.lead.update({
    where: { id: leadId },
    data: updateData,
  });

  await prisma.leadStatusChange.create({
    data: {
      leadId,
      fromStatus: lead.status,
      toStatus: newStatus,
      changedBy,
      reason,
    },
  });
}

// âââ Stale Lead Detection ââââââââââââââââââââââââââââââââââââââââââââââââââââ

export async function detectStaleLeads(): Promise<number> {
  const thresholdDays = parseInt(process.env.STALE_THRESHOLD_DAYS || "5", 10);
  const cutoffDate = subDays(new Date(), thresholdDays);

  // Find leads that have been ROUTED but not acted upon
  const staleLeads = await prisma.lead.findMany({
    where: {
      status: "ROUTED",
      routedAt: { lt: cutoffDate },
    },
    include: { assignedRep: true },
  });

  const notifications = getNotificationClient();

  // Group by rep for batch notification
  const byRep = new Map<string, typeof staleLeads>();
  for (const lead of staleLeads) {
    const repId = lead.assignedRepId || "unassigned";
    if (!byRep.has(repId)) byRep.set(repId, []);
    byRep.get(repId)!.push(lead);
  }

  // Mark as stale and notify
  for (const lead of staleLeads) {
    await updateLeadStatus(lead.id, "STALE", "system", `No action for ${thresholdDays}+ business days`);
  }

  // Send reminders to reps
  for (const [_repId, leads] of byRep) {
    const rep = leads[0].assignedRep;
    if (!rep) continue;

    const staleDetails = leads.map((l) => ({
      id: l.id,
      name: `${l.firstName} ${l.lastName}`,
      firmName: l.firmName,
      daysSinceRouted: l.routedAt
        ? differenceInBusinessDays(new Date(), l.routedAt)
        : thresholdDays,
    }));

    try {
      await notifications.sendStaleReminder(rep.email, rep.name, staleDetails);
    } catch (err) {
      console.error(`[Stale] Failed to notify ${rep.name}:`, err);
    }
  }

  console.log(`[Stale] Detected ${staleLeads.length} stale leads across ${byRep.size} reps`);
  return staleLeads.length;
}

// âââ Dashboard Statistics ââââââââââââââââââââââââââââââââââââââââââââââââââââ

export async function getDashboardStats(): Promise<DashboardStats> {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const monthStart = startOfMonth(now);

  // Total leads this week
  const totalLeadsThisWeek = await prisma.lead.count({
    where: { createdAt: { gte: weekStart } },
  });

  // Total leads this month
  const totalLeadsThisMonth = await prisma.lead.count({
    where: { createdAt: { gte: monthStart } },
  });

  // Leads by status
  const statusCounts = await prisma.lead.groupBy({
    by: ["status"],
    _count: { id: true },
  });

  const leadsByStatus: Record<LeadStatusType, number> = {
    NEW: 0,
    ROUTED: 0,
    CONTACTED: 0,
    CONVERTED: 0,
    STALE: 0,
  };
  for (const sc of statusCounts) {
    leadsByStatus[sc.status as LeadStatusType] = sc._count.id;
  }

  // Conversion rate
  const totalLeads = Object.values(leadsByStatus).reduce((a, b) => a + b, 0);
  const conversionRate = totalLeads > 0 ? leadsByStatus.CONVERTED / totalLeads : 0;

  // Average time to contact (for leads that have been contacted)
  const contactedLeads = await prisma.lead.findMany({
    where: {
      status: { in: ["CONTACTED", "CONVERTED"] },
      routedAt: { not: null },
      contactedAt: { not: null },
    },
    select: { routedAt: true, contactedAt: true },
  });

  let avgTimeToContact = 0;
  if (contactedLeads.length > 0) {
    const totalHours = contactedLeads.reduce((sum, l) => {
      return sum + differenceInHours(l.contactedAt!, l.routedAt!);
    }, 0);
    avgTimeToContact = Math.round(totalHours / contactedLeads.length);
  }

  // Leads by brand
  const brandCounts = await prisma.lead.groupBy({
    by: ["researchInterest"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
  });
  const leadsByBrand = brandCounts.map((bc) => ({
    brand: bc.researchInterest,
    count: bc._count.id,
  }));

  // Leads by territory
  const territoryCounts = await prisma.lead.groupBy({
    by: ["territoryMatch"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
  });
  const leadsByTerritory = territoryCounts
    .filter((tc) => tc.territoryMatch != null)
    .map((tc) => ({
      territory: tc.territoryMatch!,
      count: tc._count.id,
    }));

  return {
    totalLeadsThisWeek,
    totalLeadsThisMonth,
    leadsByStatus,
    conversionRate,
    avgTimeToContact,
    leadsByBrand,
    leadsByTerritory,
  };
}

// âââ Lead Metrics ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export async function getConversionMetrics() {
  // Conversion rate by territory
  const territories = await prisma.lead.groupBy({
    by: ["territoryMatch", "status"],
    _count: { id: true },
  });

  const byTerritory: Record<string, { total: number; converted: number }> = {};
  for (const t of territories) {
    const name = t.territoryMatch || "Unassigned";
    if (!byTerritory[name]) byTerritory[name] = { total: 0, converted: 0 };
    byTerritory[name].total += t._count.id;
    if (t.status === "CONVERTED") byTerritory[name].converted += t._count.id;
  }

  // Conversion rate by brand
  const brands = await prisma.lead.groupBy({
    by: ["researchInterest", "status"],
    _count: { id: true },
  });

  const byBrand: Record<string, { total: number; converted: number }> = {};
  for (const b of brands) {
    const name = b.researchInterest;
    if (!byBrand[name]) byBrand[name] = { total: 0, converted: 0 };
    byBrand[name].total += b._count.id;
    if (b.status === "CONVERTED") byBrand[name].converted += b._count.id;
  }

  return { byTerritory, byBrand };
}
