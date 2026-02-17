/**
 * Enrichment Client Abstraction Layer
 *
 * Enriches lead data with firmographic information (AUM, firm type, strategy, etc.)
 * Currently uses mock data that returns realistic financial industry examples.
 *
 * TO CONNECT BIGDOUGH OR SIMILAR:
 * 1. Implement the EnrichmentClient interface
 * 2. Replace MockEnrichmentClient in getEnrichmentClient()
 * 3. Set ENRICHMENT_PROVIDER and ENRICHMENT_API_KEY env vars
 */

import type { EnrichmentResult, FirmType } from "@/lib/types";

// âââ Interface âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export interface EnrichmentClient {
  /** Enrich a firm by domain or name */
  enrichFirm(query: { domain?: string; firmName: string }): Promise<EnrichmentResult | null>;
}

// âââ Mock Data âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

const MOCK_FIRMS: Record<string, EnrichmentResult> = {
  "logosglobal.com": {
    firmName: "Logos Global Management",
    domain: "logosglobal.com",
    firmType: "hedge_fund",
    aum: 3200,
    city: "Chicago",
    state: "IL",
    country: "US",
    employeeCount: 45,
    founded: 2008,
    description: "Long/short equity hedge fund focused on TMT and industrials",
    sectorFocus: ["technology", "industrials"],
    strategy: "Long/Short Equity",
  },
  "pinerivercap.com": {
    firmName: "Pine River Capital Management",
    domain: "pinerivercap.com",
    firmType: "hedge_fund",
    aum: 6800,
    city: "Minneapolis",
    state: "MN",
    country: "US",
    employeeCount: 120,
    founded: 2002,
    description: "Multi-strategy hedge fund",
    sectorFocus: ["multi-strategy"],
    strategy: "Multi-Strategy",
  },
  "bluefincap.com": {
    firmName: "Bluefin Capital Partners",
    domain: "bluefincap.com",
    firmType: "hedge_fund",
    aum: 1500,
    city: "San Francisco",
    state: "CA",
    country: "US",
    employeeCount: 22,
    founded: 2015,
    description: "Technology-focused hedge fund",
    sectorFocus: ["technology", "media"],
    strategy: "Long/Short Equity",
  },
  "walleyecapital.com": {
    firmName: "Walleye Capital",
    domain: "walleyecapital.com",
    firmType: "hedge_fund",
    aum: 4500,
    city: "Minneapolis",
    state: "MN",
    country: "US",
    employeeCount: 200,
    founded: 2005,
    description: "Multi-strategy investment firm",
    sectorFocus: ["multi-strategy"],
    strategy: "Multi-Strategy",
  },
  "crescentcap.ca": {
    firmName: "Crescent Capital Group",
    domain: "crescentcap.ca",
    firmType: "asset_manager",
    aum: 2100,
    city: "Toronto",
    state: "ON",
    country: "CA",
    employeeCount: 35,
    founded: 2011,
    description: "Canadian asset manager focused on energy and resources",
    sectorFocus: ["energy", "resources"],
    strategy: "Fundamental Long",
  },
  "granitepoint.com": {
    firmName: "Granite Point Capital",
    domain: "granitepoint.com",
    firmType: "family_office",
    aum: 800,
    city: "Los Angeles",
    state: "CA",
    country: "US",
    employeeCount: 8,
    founded: 2018,
    description: "Single-family office with focus on alternative investments",
    sectorFocus: ["alternatives", "real estate"],
    strategy: "Multi-Asset",
  },
  "baystreetam.ca": {
    firmName: "Bay Street Asset Management",
    domain: "baystreetam.ca",
    firmType: "asset_manager",
    aum: 5500,
    city: "Toronto",
    state: "ON",
    country: "CA",
    employeeCount: 85,
    founded: 1998,
    description: "Canadian institutional asset manager",
    sectorFocus: ["equities", "fixed income"],
    strategy: "Diversified",
  },
  "summitviewpartners.com": {
    firmName: "Summit View Partners",
    domain: "summitviewpartners.com",
    firmType: "asset_manager",
    aum: 12000,
    city: "New York",
    state: "NY",
    country: "US",
    employeeCount: 250,
    founded: 1995,
    description: "Large-cap equity manager",
    sectorFocus: ["equities"],
    strategy: "Large-Cap Growth",
  },
  "peachtreeadvisors.com": {
    firmName: "Peachtree Advisors",
    domain: "peachtreeadvisors.com",
    firmType: "ria",
    aum: 450,
    city: "Atlanta",
    state: "GA",
    country: "US",
    employeeCount: 12,
    founded: 2014,
    description: "Registered investment advisor serving HNW clients",
    sectorFocus: ["wealth management"],
    strategy: "Balanced",
  },
  "midwestpension.org": {
    firmName: "Midwest State Pension Fund",
    domain: "midwestpension.org",
    firmType: "pension",
    aum: 28000,
    city: "Columbus",
    state: "OH",
    country: "US",
    employeeCount: 60,
    founded: 1970,
    description: "State pension fund for public employees",
    sectorFocus: ["diversified"],
    strategy: "Liability-Driven",
  },
};

// âââ Mock Implementation âââââââââââââââââââââââââââââââââââââââââââââââââââââ

class MockEnrichmentClient implements EnrichmentClient {
  async enrichFirm(query: { domain?: string; firmName: string }): Promise<EnrichmentResult | null> {
    // Check by domain first
    if (query.domain) {
      const domain = query.domain.toLowerCase().replace(/^www\./, "");
      if (MOCK_FIRMS[domain]) {
        console.log(`[MockEnrichment] Found firm by domain: ${domain}`);
        return MOCK_FIRMS[domain];
      }
    }

    // Fuzzy match by firm name
    const nameLower = query.firmName.toLowerCase();
    for (const firm of Object.values(MOCK_FIRMS)) {
      if (firm.firmName.toLowerCase().includes(nameLower) ||
          nameLower.includes(firm.firmName.toLowerCase())) {
        console.log(`[MockEnrichment] Found firm by name: ${firm.firmName}`);
        return firm;
      }
    }

    // Generate plausible data for unknown firms
    console.log(`[MockEnrichment] Generating synthetic data for: ${query.firmName}`);
    const firmTypes: FirmType[] = ["hedge_fund", "asset_manager", "family_office", "ria"];
    return {
      firmName: query.firmName,
      domain: query.domain,
      firmType: firmTypes[Math.floor(Math.random() * firmTypes.length)],
      aum: Math.floor(Math.random() * 5000) + 100,
      description: `Financial services firm`,
    };
  }
}

// âââ Null Implementation (no enrichment) âââââââââââââââââââââââââââââââââââââ

class NullEnrichmentClient implements EnrichmentClient {
  async enrichFirm(_query: { domain?: string; firmName: string }): Promise<EnrichmentResult | null> {
    return null;
  }
}

// âââ Factory âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

let clientInstance: EnrichmentClient | null = null;

export function getEnrichmentClient(): EnrichmentClient {
  if (!clientInstance) {
    const provider = process.env.ENRICHMENT_PROVIDER || "bigdough";
    if (provider === "none") {
      clientInstance = new NullEnrichmentClient();
    } else {
      // TODO: When BigDough API is available, instantiate real client here
      clientInstance = new MockEnrichmentClient();
    }
  }
  return clientInstance;
}
