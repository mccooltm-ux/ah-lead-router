"use client";

import type { Lead, LeadStatus } from "@/types";
import { formatDistanceToNow } from "date-fns";
import clsx from "clsx";

interface LeadTableProps {
  leads: Lead[];
  isLoading?: boolean;
}

const statusConfig: Record<LeadStatus, { label: string; className: string }> = {
  new: { label: "New", className: "badge-new" },
  qualified: { label: "Qualified", className: "badge-qualified" },
  routed: { label: "Routed", className: "badge-routed" },
  converted: { label: "Converted", className: "badge-converted" },
  lost: { label: "Lost", className: "badge-lost" },
};

export function LeadTable({ leads, isLoading }: LeadTableProps) {
  if (isLoading) {
    return (
      <div className="card">
        <div className="card-body flex items-center justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-brand-600 dark:border-slate-700 dark:border-t-brand-400" />
          <span className="ml-3 text-slate-600 dark:text-slate-400">Loading leads...</span>
        </div>
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="card">
        <div className="card-body flex items-center justify-center py-8">
          <p className="text-slate-600 dark:text-slate-400">
            No leads found. Click &quot;Sync from CRM&quot; to import leads.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="table-header border-b border-slate-200 dark:border-slate-800">
              <th className="table-cell text-left">Name</th>
              <th className="table-cell text-left">Email</th>
              <th className="table-cell text-left">Company</th>
              <th className="table-cell text-left">Franchise</th>
              <th className="table-cell text-center">Tier</th>
              <th className="table-cell text-center">Status</th>
              <th className="table-cell text-left">Date</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="table-row">
                <td className="table-cell font-medium text-slate-900 dark:text-slate-100">
                  {lead.name}
                </td>
                <td className="table-cell text-slate-600 dark:text-slate-400 text-xs">
                  {lead.email}
                </td>
                <td className="table-cell text-slate-600 dark:text-slate-400">
                  {lead.firm}
                </td>
                <td className="table-cell">
                  {lead.franchise ? (
                    <span className="text-xs font-medium px-2 py-1 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 rounded">
                      {lead.franchise}
                    </span>
                  ) : (
                    <span className="text-slate-400">&mdash;</span>
                  )}
                </td>
                <td className="table-cell text-center">
                  {lead.tier ? (
                    <span className="text-xs text-slate-600 dark:text-slate-400">
                      {lead.tier}
                    </span>
                  ) : (
                    <span className="text-slate-400">&mdash;</span>
                  )}
                </td>
                <td className="table-cell text-center">
                  <span
                    className={clsx(
                      "badge",
                      statusConfig[lead.status as LeadStatus]?.className || "badge-new"
                    )}
                  >
                    {statusConfig[lead.status as LeadStatus]?.label || lead.status}
                  </span>
                </td>
                <td className="table-cell text-sm text-slate-500 dark:text-slate-400">
                  {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
