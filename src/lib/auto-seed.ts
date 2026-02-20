import { leadRepo, isSeeded, setSeeded } from "./db";

/**
 * Ensure store is initialized. If empty, just mark as seeded.
 * Real data comes from CRM sync (client-side).
 */
export async function ensureSeeded(): Promise<void> {
  if (isSeeded()) return;
  if (leadRepo.count() > 0) {
    setSeeded();
    return;
  }
  // No demo data â store starts empty; user syncs from CRM
  setSeeded();
}
