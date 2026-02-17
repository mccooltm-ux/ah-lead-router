/**
 * Lead Service
 *
 * CRUD operations and queries for leads.
 */

import { prisma } from "@/lib/db";
import type { Lead, LeadStatus, Prisma } from "@prisma/client";

// âââ Types âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export interface LeadFilters {
  status?: LeadStatus;
  researchInterest?: string;
  territoryMatch?: string;
  assignedRepId?: string;
  search?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface LeadWithRelations extends Lead {
  assignedRep?: { id: string; name: string; email: string } | null;
  account?: { id: string; firmName: string; status: string } | null;
  statusChanges?: { id: string; fromStatus: LeadStatus | null; toStatus: LeadStatus; changedBy: string | null; reason: string | null; createdAt: Date }[];
  notes?: { id: string; author: string; content: string; createdAt: Date }[];
}

// âââ Queries âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export async function getLeads(filters: LeadFilters = {}): Promise<{
  leads: LeadWithRelations[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const page = filters.page || 1;
  const pageSize = filters.pageSize || 25;
  const skip = (page - 1) * pageSize;

  const where: Prisma.LeadWhereInput = {};
  if (filters.status) where.status = filters.status;
  if (filters.researchInterest) where.researchInterest = filters.researchInterest;
  if (filters.territoryMatch) where.territoryMatch = filters.territoryMatch;
  if (filters.assignedRepId) where.assignedRepId = filters.assignedRepId;
  if (filters.search) {
    where.OR = [
      { firstName: { contains: filters.search, mode: "insensitive" } },
      { lastName: { contains: filters.search, mode: "insensitive" } },
      { firmName: { contains: filters.search, mode: "insensitive" } },
      { email: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  const orderBy: Prisma.LeadOrderByWithRelationInput = {};
  const sortBy = filters.sortBy || "createdAt";
  const sortDir = filters.sortDir || "desc";
  (orderBy as Record<string, string>)[sortBy] = sortDir;

  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      orderBy,
      skip,
      take: pageSize,
      include: {
        assignedRep: { select: { id: true, name: true, email: true } },
        account: { select: { id: true, firmName: true, status: true } },
      },
    }),
    prisma.lead.count({ where }),
  ]);

  return { leads: leads as LeadWithRelations[], total, page, pageSize };
}

export async function getLeadById(id: string): Promise<LeadWithRelations | null> {
  return prisma.lead.findUnique({
    where: { id },
    include: {
      assignedRep: { select: { id: true, name: true, email: true } },
      account: { select: { id: true, firmName: true, status: true } },
      statusChanges: { orderBy: { createdAt: "desc" } },
      notes: { orderBy: { createdAt: "desc" } },
    },
  }) as Promise<LeadWithRelations | null>;
}

export async function addLeadNote(
  leadId: string,
  author: string,
  content: string
): Promise<void> {
  await prisma.leadNote.create({
    data: { leadId, author, content },
  });
}

export async function reassignLead(
  leadId: string,
  newRepId: string,
  changedBy: string
): Promise<void> {
  const rep = await prisma.salesRep.findUnique({ where: { id: newRepId } });
  if (!rep) throw new Error(`Rep not found: ${newRepId}`);

  await prisma.lead.update({
    where: { id: leadId },
    data: { assignedRepId: newRepId },
  });

  await prisma.leadNote.create({
    data: {
      leadId,
      author: changedBy,
      content: `Reassigned to ${rep.name}`,
    },
  });
}

// âââ Stale Leads Query ââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export async function getStaleLeads(): Promise<LeadWithRelations[]> {
  return prisma.lead.findMany({
    where: { status: "STALE" },
    orderBy: { staleAt: "desc" },
    include: {
      assignedRep: { select: { id: true, name: true, email: true } },
      account: { select: { id: true, firmName: true, status: true } },
    },
  }) as Promise<LeadWithRelations[]>;
}

// âââ Create Lead âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export async function createLead(data: {
  firstName: string;
  lastName: string;
  email: string;
  title?: string;
  phone?: string;
  firmName: string;
  registrationType: string;
  researchInterest: string;
  source?: string;
  city?: string;
  state?: string;
  country?: string;
}): Promise<Lead> {
  return prisma.lead.create({
    data: {
      ...data,
      country: data.country || "US",
      status: "NEW",
    },
  });
}
