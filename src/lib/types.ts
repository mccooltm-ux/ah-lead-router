// âââ Affiliate Brands ââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export const AFFILIATE_BRANDS = {
  cannonball: { name: "Cannonball", sector: "Adtech" },
  fermium: { name: "Fermium", sector: "Chemicals" },
  fftt: { name: "FFTT", sector: "Macro" },
  glj: { name: "GLJ", sector: "Solar/EV/Steel" },
  hjones: { name: "HJones", sector: "Agriculture" },
  ironadvisor: { name: "IronAdvisor", sector: "Industrials" },
  lightshed: { name: "LightShed", sector: "Media/Telecom" },
  optimal: { name: "Optimal", sector: "Consumer" },
  rubinson: { name: "Rubinson", sector: "Consumer" },
  sankey: { name: "Sankey", sector: "Energy" },
  schneider: { name: "Schneider", sector: "Energy" },
} as const;

export type AffiliateBrandSlug = keyof typeof AFFILIATE_BRANDS;

// âââ Registration Types ââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export type RegistrationType =
  | "trial"
  | "sample_report"
  | "webinar"
  | "newsletter"
  | "other";

// âââ Firm Types ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export type FirmType =
  | "hedge_fund"
  | "asset_manager"
  | "family_office"
  | "pension"
  | "endowment"
  | "ria"
  | "bank"
  | "insurance"
  | "corporate"
  | "other";

export const FIRM_TYPE_LABELS: Record<FirmType, string> = {
  hedge_fund: "Hedge Fund",
  asset_manager: "Asset Manager",
  family_office: "Family Office",
  pension: "Pension Fund",
  endowment: "Endowment",
  ria: "RIA",
  bank: "Bank / Broker-Dealer",
  insurance: "Insurance",
  corporate: "Corporate",
  other: "Other",
};

// âââ Lead Status âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export type LeadStatusType = "NEW" | "ROUTED" | "CONTACTED" | "CONVERTED" | "STALE";

export const STATUS_LABELS: Record<LeadStatusType, string> = {
  NEW: "New",
  ROUTED: "Routed",
  CONTACTED: "Contacted",
  CONVERTED: "Converted",
  STALE: "Stale",
};

export const STATUS_COLORS: Record<LeadStatusType, string> = {
  NEW: "bg-blue-100 text-blue-800",
  ROUTED: "bg-yellow-100 text-yellow-800",
  CONTACTED: "bg-purple-100 text-purple-800",
  CONVERTED: "bg-green-100 text-green-800",
  STALE: "bg-red-100 text-red-800",
};

// âââ CRM Client Interfaces ââââââââââââââââââââââââââââââââââââââââââââââââââ

export interface CrmRegistration {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  title?: string;
  phone?: string;
  firmName: string;
  registrationType: RegistrationType;
  researchInterest: string;
  source?: string;
  registeredAt: string;
}

export interface CrmAccountRecord {
  id: string;
  firmName: string;
  domain?: string;
  repOwner?: string;
  territory?: string;
  status: string;
  products: string[];
}

export interface CrmContactRecord {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  firmId?: string;
  distributionLists: string[];
}

// âââ Enrichment Interfaces âââââââââââââââââââââââââââââââââââââââââââââââââââ

export interface EnrichmentResult {
  firmName: string;
  domain?: string;
  firmType?: FirmType;
  aum?: number;
  city?: string;
  state?: string;
  country?: string;
  employeeCount?: number;
  founded?: number;
  description?: string;
  sectorFocus?: string[];
  strategy?: string;
}

// âââ Lead Scoring ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export interface ScoreBreakdown {
  existingAccount: number;
  firmType: number;
  aumTier: number;
  registrationType: number;
  territoryMatch: number;
  total: number;
}

// âââ Notification Payloads âââââââââââââââââââââââââââââââââââââââââââââââââââ

export interface LeadNotificationPayload {
  repName: string;
  repEmail: string;
  lead: {
    id: string;
    name: string;
    title?: string;
    firmName: string;
    researchInterest: string;
    leadScore: number;
    isExistingAccount: boolean;
    scoreBreakdown: ScoreBreakdown;
  };
  dashboardUrl: string;
}

export interface DailyDigestPayload {
  date: string;
  totalLeads: number;
  leadsByTerritory: Record<string, number>;
  leadsByBrand: Record<string, number>;
  staleLeads: number;
  conversionRate: number;
}

// âââ API Response Types ââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// âââ Dashboard Stats âââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export interface DashboardStats {
  totalLeadsThisWeek: number;
  totalLeadsThisMonth: number;
  leadsByStatus: Record<LeadStatusType, number>;
  conversionRate: number;
  avgTimeToContact: number; // in hours
  leadsByBrand: { brand: string; count: number }[];
  leadsByTerritory: { territory: string; count: number }[];
}
