// Lead Status types
export type LeadStatus = "new" | "qualified" | "routed" | "converted" | "lost";

// Lead Source types
export type LeadSource = "inbound_web" | "conference" | "referral" | "csv_import" | "manual" | "crm_sync";

// CRM Franchise names (real affiliate brands from Analyst Hub CRM)
export type Franchise =
  | "Fermium Research"
  | "FFTT"
  | "Sankey Research"
  | "Kalinowski Equity Research"
  | "Fox Advisors"
  | "Rubinson Research"
  | "Optimal Advisory"
  | "The Schneider Capital Group"
  | "GLJ Research"
  | "Heather Jones Research"
  | "IronAdvisor Insights"
  | "Sakonnet Research"
  | "Brogan Group Equity Research"
  | "Cannonball Research";

// CRM Tier types
export type LeadTier = "" | "Lead" | "Link" | "Standard Subscriber" | "Subscriber" | "Trial Subscriber" | "Premium Subscriber" | "Tier 1" | "Tier 2" | "Tier 3" | "Removed";

// Core Lead type
export interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  firm: string;
  title: string;
  source: string;
  status: LeadStatus;
  franchise?: string | null;
  tier?: string | null;
  routedTo?: string | null;
  score: number;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  convertedAt?: Date | null;
  // CRM sync fields
  crmId?: string | null;
  crmContactId?: string | null;
  crmFranchiseId?: string | null;
  lastSyncedAt?: Date | null;
}

// CRM Lead import shape (from GraphQL API)
export interface CrmLeadImport {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  company: string;
  franchise: string;
  tier: string;
  updatedAt: string;
  contactId?: string;
  franchiseId?: string;
  accountId?: string;
}

// Dashboard Statistics
export interface DashboardStats {
  totalLeads: number;
  qualifiedLeads: number;
  convertedLeads: number;
  conversionRate: number;
  averageScore: number;
  leadsPerFranchise: Record<string, number>;
  leadsPerTier: Record<string, number>;
  lastSyncedAt?: string | null;
}

// Lead Filters
export interface LeadFilters {
  status?: LeadStatus[];
  franchise?: string[];
  tier?: string[];
  search?: string;
  page?: number;
  limit?: number;
}

// Paginated Response
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// CRM Sync status
export interface CrmSyncStatus {
  lastSyncedAt: string | null;
  totalImported: number;
  franchiseBreakdown: Record<string, number>;
}
