/**
 * Routing is now handled by the CRM â leads come pre-assigned to franchises.
 * This module is kept for potential future local routing logic.
 */

import type { Lead } from "@/types";

/**
 * Get all franchise names that have been imported from CRM
 */
export function getActiveFranchises(leads: Lead[]): string[] {
  const franchises = new Set<string>();
  leads.forEach((l) => {
    if (l.franchise) franchises.add(l.franchise);
  });
  return Array.from(franchises).sort();
}
