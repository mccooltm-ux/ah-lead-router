import type { Lead, DashboardStats, LeadFilters, PaginatedResponse, CrmLeadImport } from "@/types";

// In-memory store using globalThis for serverless compatibility
declare global {
  var leadsStore: Map<string, Lead> | undefined;
  var isSeeded: boolean | undefined;
  var lastCrmSync: string | undefined;
}

function getLeadsStore(): Map<string, Lead> {
  if (!globalThis.leadsStore) {
    globalThis.leadsStore = new Map();
  }
  return globalThis.leadsStore;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export const leadRepo = {
  getAll(): Lead[] {
    return Array.from(getLeadsStore().values());
  },

  getById(id: string): Lead | null {
    return getLeadsStore().get(id) || null;
  },

  getFiltered(filters: LeadFilters): PaginatedResponse<Lead> {
    let leads = this.getAll();

    if (filters.status && filters.status.length > 0) {
      leads = leads.filter((l) => filters.status!.includes(l.status as any));
    }

    if (filters.franchise && filters.franchise.length > 0) {
      leads = leads.filter((l) =>
        filters.franchise!.includes(l.franchise || "")
      );
    }

    if (filters.tier && filters.tier.length > 0) {
      leads = leads.filter((l) =>
        filters.tier!.includes(l.tier || "")
      );
    }

    if (filters.search && filters.search.trim()) {
      const search = filters.search.toLowerCase();
      leads = leads.filter(
        (l) =>
          l.name.toLowerCase().includes(search) ||
          l.email.toLowerCase().includes(search) ||
          l.firm.toLowerCase().includes(search) ||
          (l.franchise || "").toLowerCase().includes(search)
      );
    }

    // Sort by creation date (newest first)
    leads.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const page = filters.page || 1;
    const limit = filters.limit || 25;
    const start = (page - 1) * limit;
    const end = start + limit;

    return {
      data: leads.slice(start, end),
      total: leads.length,
      page,
      limit,
      totalPages: Math.ceil(leads.length / limit),
    };
  },

  create(leadData: Partial<Lead>): Lead {
    const now = new Date();
    const lead: Lead = {
      id: leadData.id || generateId(),
      name: leadData.name || "",
      email: leadData.email || "",
      phone: leadData.phone || null,
      firm: leadData.firm || "",
      title: leadData.title || "",
      source: leadData.source || "manual",
      status: leadData.status || "new",
      franchise: leadData.franchise || null,
      tier: leadData.tier || null,
      routedTo: leadData.routedTo || leadData.franchise || null,
      score: leadData.score || 0,
      notes: leadData.notes || null,
      createdAt: leadData.createdAt ? new Date(leadData.createdAt) : now,
      updatedAt: leadData.updatedAt ? new Date(leadData.updatedAt) : now,
      convertedAt: leadData.convertedAt ? new Date(leadData.convertedAt) : null,
      crmId: leadData.crmId || null,
      crmContactId: leadData.crmContactId || null,
      crmFranchiseId: leadData.crmFranchiseId || null,
      lastSyncedAt: leadData.lastSyncedAt ? new Date(leadData.lastSyncedAt) : null,
    };

    getLeadsStore().set(lead.id, lead);
    return lead;
  },

  update(id: string, updates: Partial<Lead>): Lead | null {
    const lead = this.getById(id);
    if (!lead) return null;

    const updated: Lead = {
      ...lead,
      ...updates,
      id: lead.id,
      createdAt: lead.createdAt,
      updatedAt: new Date(),
    };

    getLeadsStore().set(id, updated);
    return updated;
  },

  delete(id: string): boolean {
    return getLeadsStore().delete(id);
  },

  clear(): void {
    getLeadsStore().clear();
    globalThis.isSeeded = false;
  },

  count(): number {
    return getLeadsStore().size;
  },

  /**
   * Import leads from CRM data â upserts by crmId or email
   */
  importFromCrm(crmLeads: CrmLeadImport[]): { imported: number; updated: number } {
    let imported = 0;
    let updated = 0;
    const now = new Date();

    for (const crm of crmLeads) {
      const existing = this.getAll().find(
        (l) => l.crmId === crm.id || l.email === crm.email
      );

      if (existing) {
        this.update(existing.id, {
          name: crm.name,
          firm: crm.company,
          phone: crm.phone || null,
          franchise: crm.franchise,
          tier: crm.tier || null,
          routedTo: crm.franchise,
          crmId: crm.id,
          crmContactId: crm.contactId || null,
          crmFranchiseId: crm.franchiseId || null,
          lastSyncedAt: now,
        });
        updated++;
      } else {
        this.create({
          name: crm.name,
          email: crm.email,
          phone: crm.phone || null,
          firm: crm.company,
          title: "",
          source: "crm_sync",
          status: crm.tier === "Lead" || crm.tier === "" ? "new" : "qualified",
          franchise: crm.franchise,
          tier: crm.tier || null,
          routedTo: crm.franchise,
          score: 0,
          createdAt: new Date(crm.updatedAt),
          updatedAt: new Date(crm.updatedAt),
          crmId: crm.id,
          crmContactId: crm.contactId || null,
          crmFranchiseId: crm.franchiseId || null,
          lastSyncedAt: now,
        });
        imported++;
      }
    }

    globalThis.lastCrmSync = now.toISOString();
    return { imported, updated };
  },

  getStats(): DashboardStats {
    const leads = this.getAll();

    const qualifiedLeads = leads.filter(
      (l) => l.status === "qualified" || l.status === "routed"
    ).length;
    const convertedLeads = leads.filter((l) => l.status === "converted").length;

    const leadsPerFranchise: Record<string, number> = {};
    leads.forEach((lead) => {
      const franchise = lead.franchise || "Unassigned";
      leadsPerFranchise[franchise] = (leadsPerFranchise[franchise] || 0) + 1;
    });

    const leadsPerTier: Record<string, number> = {};
    leads.forEach((lead) => {
      const tier = lead.tier || "(No Tier)";
      leadsPerTier[tier] = (leadsPerTier[tier] || 0) + 1;
    });

    const averageScore =
      leads.length > 0
        ? Math.round(leads.reduce((sum, l) => sum + l.score, 0) / leads.length)
        : 0;

    return {
      totalLeads: leads.length,
      qualifiedLeads,
      convertedLeads,
      conversionRate:
        leads.length > 0 ? Math.round((convertedLeads / leads.length) * 100) : 0,
      averageScore,
      leadsPerFranchise,
      leadsPerTier,
      lastSyncedAt: globalThis.lastCrmSync || null,
    };
  },
};

export function setSeeded(): void {
  globalThis.isSeeded = true;
}

export function isSeeded(): boolean {
  return globalThis.isSeeded === true;
}
