/**
 * CRM Client Abstraction Layer
 *
 * This module defines the interface for integrating with Analyst Hub's CRM.
 * Currently uses mock implementations returning realistic sample data.
 *
 * TO CONNECT THE REAL CRM:
 * 1. Implement the CrmClient interface methods using your CRM's API
 * 2. Replace MockCrmClient with your implementation in getCrmClient()
 * 3. Set CRM_API_URL and CRM_API_KEY environment variables
 */

import type {
  CrmRegistration,
  CrmAccountRecord,
  CrmContactRecord,
} from "@/lib/types";

export interface CrmClient {
  fetchNewRegistrations(since?: Date): Promise<CrmRegistration[]>;
  lookupAccount(query: { domain?: string; firmName?: string }): Promise<CrmAccountRecord | null>;
  upsertContact(contact: Partial<CrmContactRecord> & { email: string }): Promise<CrmContactRecord>;
  addToDistributionList(contactId: string, listName: string): Promise<void>;
  getContactsByFirm(firmId: string): Promise<CrmContactRecord[]>;
}

class MockCrmClient implements CrmClient {
  async fetchNewRegistrations(): Promise<CrmRegistration[]> { return []; }
  async lookupAccount(q: { domain?: string; firmName?: string }): Promise<CrmAccountRecord | null> {
    console.log(`[MockCRM] Looking up account: ${q.domain || q.firmName}`);
    return null;
  }
  async upsertContact(c: Partial<CrmContactRecord> & { email: string }): Promise<CrmContactRecord> {
    return { id: `crm-${Date.now()}`, firstName: c.firstName||'', lastName: c.lastName||'', email: c.email, firmId: c.firmId, distributionLists: c.distributionLists||[] };
  }
  async addToDistributionList(): Promise<void> {}
  async getContactsByFirm(): Promise<CrmContactRecord[]> { return []; }
}

let clientInstance: CrmClient | null = null;
export function getCrmClient(): CrmClient {
  if (!clientInstance) clientInstance = new MockCrmClient();
  return clientInstance;
}
