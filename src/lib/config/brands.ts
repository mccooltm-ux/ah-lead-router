import { AFFILIATE_BRANDS, type AffiliateBrandSlug } from "@/lib/types";

// Map registration keywords/research interests to affiliate brand slugs
const KEYWORD_BRAND_MAP: Record<string, AffiliateBrandSlug> = {
  // Direct brand name matches
  cannonball: "cannonball",
  fermium: "fermium",
  fftt: "fftt",
  glj: "glj",
  hjones: "hjones",
  ironadvisor: "ironadvisor",
  lightshed: "lightshed",
  optimal: "optimal",
  rubinson: "rubinson",
  sankey: "sankey",
  schneider: "schneider",

  // Sector keyword matches
  adtech: "cannonball",
  "ad tech": "cannonball",
  advertising: "cannonball",
  chemicals: "fermium",
  chemical: "fermium",
  macro: "fftt",
  macroeconomic: "fftt",
  solar: "glj",
  ev: "glj",
  "electric vehicle": "glj",
  steel: "glj",
  agriculture: "hjones",
  farming: "hjones",
  agri: "hjones",
  industrials: "ironadvisor",
  industrial: "ironadvisor",
  media: "lightshed",
  telecom: "lightshed",
  telecommunications: "lightshed",
  consumer: "optimal", // defaults to Optimal; Rubinson is also consumer
  energy: "sankey", // defaults to Sankey; Schneider is also energy
  oil: "sankey",
  gas: "sankey",
  "oil & gas": "sankey",
  utilities: "schneider",
  power: "schneider",
};

export function matchBrand(researchInterest: string): AffiliateBrandSlug | null {
  const lower = researchInterest.toLowerCase().trim();

  // Direct slug match
  if (lower in AFFILIATE_BRANDS) {
    return lower as AffiliateBrandSlug;
  }

  // Keyword search
  for (const [keyword, brand] of Object.entries(KEYWORD_BRAND_MAP)) {
    if (lower.includes(keyword)) {
      return brand;
    }
  }

  return null;
}

export function getBrandLabel(slug: string): string {
  const brand = AFFILIATE_BRANDS[slug as AffiliateBrandSlug];
  return brand ? `${brand.name} (${brand.sector})` : slug;
}
