/**
 * Client-side CRM sync module.
 * Fetches leads from the Analyst Hub CRM GraphQL API (browser has auth cookies),
 * then pushes them to the lead router's /api/crm/import endpoint.
 */

const CRM_GRAPHQL_URL = "https://api.analysthub.com/graphql";

const GET_ALL_LEADS_QUERY = `
query GetAllLeads($orderBy: FranchiseLinkOrderBy, $where: FranchiseLinkWhereFilter, $first: String, $take: Int) {
  franchiseLinks(orderBy: $orderBy, where: $where, first: $first, take: $take) {
    items {
      id
      tier
      Contact {
        id
        fullName
        email
        phone
        userDefinedAccount
        Account { id name }
      }
      Franchise { id name }
      updatedAt
    }
    pageInfo { endCursor hasNextPage nextCursor }
  }
  franchiseLinksCount(where: $where)
}`;

const LEADS_WHERE_FILTER = {
  isLead: { equals: true },
  AND: [
    {
      OR: [
        { Contact: { salesPersonId: {} } },
        { Contact: { Account: { FranchiseSalesPersons: {} } } },
      ],
    },
  ],
};

export interface CrmSyncResult {
  success: boolean;
  fetched: number;
  imported: number;
  updated: number;
  total: number;
  error?: string;
}

/**
 * Fetch all leads from CRM via GraphQL (paginated) using the browser's auth cookies.
 */
async function fetchAllCrmLeads(
  onProgress?: (fetched: number, total: number) => void
): Promise<any[]> {
  let allItems: any[] = [];
  let cursor: string | null = null;
  let totalCount = 0;
  let page = 0;

  while (true) {
    page++;
    const variables: any = {
      where: LEADS_WHERE_FILTER,
      orderBy: { updatedAt: "desc" },
      take: 50,
    };
    if (cursor) variables.first = cursor;

    const resp = await fetch(CRM_GRAPHQL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        operationName: "GetAllLeads",
        query: GET_ALL_LEADS_QUERY,
        variables,
      }),
    });

    if (!resp.ok) {
      throw new Error(`CRM API returned ${resp.status}: ${resp.statusText}`);
    }

    const data = await resp.json();

    if (data.errors) {
      throw new Error(`CRM GraphQL error: ${data.errors[0]?.message}`);
    }

    const items = data?.data?.franchiseLinks?.items || [];
    const pageInfo = data?.data?.franchiseLinks?.pageInfo;
    totalCount = data?.data?.franchiseLinksCount || totalCount;

    allItems = allItems.concat(items);

    if (onProgress) onProgress(allItems.length, totalCount);

    if (!pageInfo?.hasNextPage || !pageInfo?.nextCursor || items.length === 0) break;
    cursor = pageInfo.nextCursor;

    if (page > 30) break; // safety limit
  }

  return allItems;
}

/**
 * Transform raw CRM GraphQL items to flat import format
 */
function transformCrmItems(items: any[]): any[] {
  return items.map((item) => ({
    id: item.id,
    name: item.Contact?.fullName || "",
    email: item.Contact?.email || "",
    phone: item.Contact?.phone || null,
    company: item.Contact?.Account?.name || item.Contact?.userDefinedAccount || "",
    franchise: item.Franchise?.name || "",
    tier: item.tier || "",
    updatedAt: item.updatedAt,
    contactId: item.Contact?.id,
    franchiseId: item.Franchise?.id,
    accountId: item.Contact?.Account?.id,
  }));
}

/**
 * Full CRM sync: fetch from CRM GraphQL API, push to lead router
 */
export async function syncFromCrm(
  options: { replace?: boolean; onProgress?: (fetched: number, total: number) => void } = {}
): Promise<CrmSyncResult> {
  try {
    // Step 1: Fetch all leads from CRM
    const rawItems = await fetchAllCrmLeads(options.onProgress);
    const leads = transformCrmItems(rawItems);

    if (leads.length === 0) {
      return {
        success: false,
        fetched: 0,
        imported: 0,
        updated: 0,
        total: 0,
        error: "No leads found in CRM. Make sure you are logged in at crm.analysthub.com",
      };
    }

    // Step 2: Push to lead router import endpoint
    const importResp = await fetch("/api/crm/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leads, replace: options.replace ?? true }),
    });

    if (!importResp.ok) {
      throw new Error(`Import API returned ${importResp.status}`);
    }

    const importData = await importResp.json();

    return {
      success: true,
      fetched: leads.length,
      imported: importData.data?.imported || 0,
      updated: importData.data?.updated || 0,
      total: importData.data?.total || leads.length,
    };
  } catch (error: any) {
    return {
      success: false,
      fetched: 0,
      imported: 0,
      updated: 0,
      total: 0,
      error: error.message || "CRM sync failed",
    };
  }
}
