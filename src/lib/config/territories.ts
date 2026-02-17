// âââ Territory Definitions âââââââââââââââââââââââââââââââââââââââââââââââââââ
// These are the starting configurations. Managed via DB at runtime.

export const MIDWEST_STATES = [
  "IL", "IN", "IA", "KS", "MI", "MN", "MO", "NE", "ND", "OH", "SD", "WI",
];

export const WEST_COAST_STATES = ["CA", "OR", "WA", "AK", "HI"];

export const CANADIAN_PROVINCES = [
  "AB", "BC", "MB", "NB", "NL", "NS", "NT", "NU", "ON", "PE", "QC", "SK", "YT",
];

export const SOUTHEAST_STATES = [
  "AL", "AR", "FL", "GA", "KY", "LA", "MS", "NC", "SC", "TN", "VA", "WV",
];

export const EAST_COAST_STATES = [
  "CT", "DE", "DC", "ME", "MD", "MA", "NH", "NJ", "NY", "PA", "RI", "VT",
];

export const MOUNTAIN_STATES = ["AZ", "CO", "ID", "MT", "NM", "NV", "UT", "WY"];

export const US_STATE_NAMES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", DC: "District of Columbia",
  FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois",
  IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana",
  ME: "Maine", MD: "Maryland", MA: "Massachusetts", MI: "Michigan",
  MN: "Minnesota", MS: "Mississippi", MO: "Missouri", MT: "Montana",
  NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey",
  NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota",
  OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania",
  RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota", TN: "Tennessee",
  TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia", WA: "Washington",
  WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
};

export const CA_PROVINCE_NAMES: Record<string, string> = {
  AB: "Alberta", BC: "British Columbia", MB: "Manitoba", NB: "New Brunswick",
  NL: "Newfoundland and Labrador", NS: "Nova Scotia", NT: "Northwest Territories",
  NU: "Nunavut", ON: "Ontario", PE: "Prince Edward Island", QC: "Quebec",
  SK: "Saskatchewan", YT: "Yukon",
};

// Map a state/province code to a territory name
export function findTerritoryForRegion(
  stateOrProvince: string,
  country: string = "US"
): string | null {
  const code = stateOrProvince.toUpperCase();

  if (country === "CA" || CANADIAN_PROVINCES.includes(code)) {
    return "Midwest + Canada + West Coast";
  }
  if (MIDWEST_STATES.includes(code)) return "Midwest + Canada + West Coast";
  if (WEST_COAST_STATES.includes(code)) return "Midwest + Canada + West Coast";
  if (EAST_COAST_STATES.includes(code)) return "East Coast";
  if (SOUTHEAST_STATES.includes(code)) return "Southeast";
  if (MOUNTAIN_STATES.includes(code)) return "Mountain / Central";
  if (code === "TX" || code === "OK") return "Mountain / Central";

  return null; // unassigned
}

// Default territory seed data
export const DEFAULT_TERRITORIES = [
  {
    name: "Midwest + Canada + West Coast",
    regions: [...MIDWEST_STATES, ...WEST_COAST_STATES, ...CANADIAN_PROVINCES],
    country: "US", // includes CA via regions
    repName: "Ted McCool",
    repEmail: "ted@analysthub.com",
  },
  {
    name: "East Coast",
    regions: EAST_COAST_STATES,
    country: "US",
    repName: "Sarah Chen",
    repEmail: "sarah@analysthub.com",
  },
  {
    name: "Southeast",
    regions: SOUTHEAST_STATES,
    country: "US",
    repName: "Marcus Johnson",
    repEmail: "marcus@analysthub.com",
  },
  {
    name: "Mountain / Central",
    regions: [...MOUNTAIN_STATES, "TX", "OK"],
    country: "US",
    repName: "Lisa Rodriguez",
    repEmail: "lisa@analysthub.com",
  },
];
