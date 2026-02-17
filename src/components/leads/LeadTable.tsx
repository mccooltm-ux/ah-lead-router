"use client";

import Link from "next/link";
import { StatusBadge, ScoreBadge } from "@/components/ui/Badge";
import { getBrandLabel } from "@/lib/config/brands";
import { format } from "date-fns";

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  title?: string;
  firmName: string;
  researchInterest: string;
  leadScore: number;
  status: string;
  territoryMatch?: string | null;
  assignedRep?: { id: string; name: string } | null;
  account?: { id: string; firmName: string } | null;
  createdAt: string;
}

interface LeadTableProps {
  leads: Lead[];
  sortBy: string;
  sortDir: "asc" | "desc";
  onSort: (field: string) => void;
}

function SortHeader({
  label,
  field,
  currentSort,
  currentDir,
  onSort,
}: {
  label: string;
  field: string;
  currentSort: string;
  currentDir: string;
  onSort: (field: string) => void;
}) {
  const isActive = currentSort === field;
  return (
    <th
      className="cursor-pointer whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 transition-colors hover:text-gray-700"
      onClick={() => onSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {isActive && (
          <svg className={`h-3 w-3 ${currentDir === "desc" ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
          </svg>
        )}
      </span>
    </th>
  );
}

export function LeadTable({ leads, sortBy, sortDir, onSort }: LeadTableProps) {
  if (leads.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-gray-200 bg-white">
        <p className="text-sm text-gray-500">No leads found matching your filters.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <SortHeader label="Contact" field="lastName" currentSort={sortBy} currentDir={sortDir} onSort={onSort} />
              <SortHeader label="Firm" field="firmName" currentSort={sortBy} currentDir={sortDir} onSort={onSort} />
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Research</th>
              <SortHeader label="Score" field="leadScore" currentSort={sortBy} currentDir={sortDir} onSort={onSort} />
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Territory</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Rep</th>
              <SortHeader label="Status" field="status" currentSort={sortBy} currentDir={sortDir} onSort={onSort} />
              <SortHeader label="Date" field="createdAt" currentSort={sortBy} currentDir={sortDir} onSort={onSort} />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {leads.map((lead) => (
              <tr
                key={lead.id}
                className="transition-colors hover:bg-blue-50/50"
              >
                <td className="whitespace-nowrap px-4 py-3">
                  <Link href={`/leads/${lead.id}`} className="group">
                    <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600">
                      {lead.firstName} {lead.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{lead.title || lead.email}</p>
                  </Link>
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <p className="text-sm text-gray-900">{lead.firmName}</p>
                  {lead.account && (
                    <p className="text-xs font-medium text-green-600">Existing Account</p>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <p className="text-sm text-gray-700">
                    {getBrandLabel(lead.researchInterest).split(" (")[0]}
                  </p>
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <ScoreBadge score={lead.leadScore} />
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <p className="text-sm text-gray-600">{lead.territoryMatch || "â"}</p>
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <p className="text-sm text-gray-600">{lead.assignedRep?.name || "Unassigned"}</p>
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <StatusBadge status={lead.status} />
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                  {format(new Date(lead.createdAt), "MMM d, h:mm a")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
