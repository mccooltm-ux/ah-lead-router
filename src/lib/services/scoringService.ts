/**
 * Lead Scoring Service
 */
import type { ScoreBreakdown, FirmType, RegistrationType } from "@/lib/types";
const WEIGHTS = {
  existingAccount: { yes: 25, no: 0 },
  firmType: { hedge_fund: 20, asset_manager: 18, family_office: 15, pension: 20, endowment: 18, ria: 10, bank: 12, insurance: 10, corporate: 5, other: 3 } as Record<string, number>,
  aumTier: { tier1: { min: 10000, score: 25 }, tier2: { min: 5000, score: 20 }, tier3: { min: 1000, score: 15 }, tier4: { min: 500, score: 10 }, tier5: { min: 100, score: 5 }, tier6: { min: 0, score: 2 } },
  registrationType: { trial: 15, sample_report: 12, webinar: 10, newsletter: 5, other: 3 } as Record<string, number>,
  territoryMatch: { matched: 15, unmatched: 5 },
};

export function scoreLead(p: { isExistingAccount: boolean; firmType?: FirmType | string | null; aum?: number | null; registrationType: RegistrationType | string; hasTerritoryMatch: boolean; }): ScoreBreakdown {
  const existingAccount = p.isExistingAccount ? WEIGHTS.existingAccount.yes : WEIGHTS.existingAccount.no;
  const firmType = p.firmType ? (WEIGHTS.firmType[p.firmType] ?? WEIGHTS.firmType.other) : 0;
  let aumTier = 0;
  if (p.aum != null) {
    const t = WEIGHTS.aumTier;
    if (p.aum >= t.tier1.min) aumTier = t.tier1.score;
    else if (p.aum >= t.tier2.min) aumTier = t.tier2.score;
    else if (p.aum >= t.tier3.min) aumTier = t.tier3.score;
    else if (p.aum >= t.tier4.min) aumTier = t.tier4.score;
    else if (p.aum >= t.tier5.min) aumTier = t.tier5.score;
    else aumTier = t.tier6.score;
  }
  const registrationType = WEIGHTS.registrationType[p.registrationType] ?? WEIGHTS.registrationType.other;
  const territoryMatch = p.hasTerritoryMatch ? WEIGHTS.territoryMatch.matched : WEIGHTS.territoryMatch.unmatched;
  const total = Math.min(100, existingAccount + firmType + aumTier + registrationType + territoryMatch);
  return { existingAccount, firmType, aumTier, registrationType, territoryMatch, total };
}

export function getScoreLabel(score: number): { label: string; color: string } {
  if (score >= 75) return { label: "Hot", color: "text-red-600 bg-red-50" };
  if (score >= 50) return { label: "Warm", color: "text-orange-600 bg-orange-50" };
  if (score >= 25) return { label: "Cool", color: "text-blue-600 bg-blue-50" };
  return { label: "Cold", color: "text-gray-600 bg-gray-50" };
}
