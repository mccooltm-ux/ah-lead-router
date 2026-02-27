"use client";

import Link from "next/link";
import { StatusBadge, ScoreBadge } from "@/components/ui/Badge";
import { getBrandLabel } from "@/lib/config/brands";
import { format, formatDistanceToNow } from "date-fns";
import { clsx } from "clsx";

interface PipelineLead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  title?: string;
  firmName: string;
  firmType?: string | null;
  researchInterest: string;
  leadScore: number;
  scoreTier: "Hot" | "Warm" | "Cool" | "Cold";
  status: string;
  territoryMatch?: string | null;
  assignedRep?: { id: string; name: string; email: string } | null;
  account?: {
    id: string;
    firmName: string;
    status: string;
    products: string[];
  } | null;
  daysElapsed: number;
  daysRemaining: number;
  progressPercent: number;
  isOverdue: boolean;
  conversionWindowDays: number;
  createdAt: string;
  routedAt: string | null;
  contactedAt: string | null;
  convertedAt: string | null;
}

interface PipelineTableProps {
  leads: PipelineLead[];
}

const TIER_STYLES: Record<string, string> = {
  Hot: "bg-red-100 text-red-800 border-red-200",
  Warm: "bg-orange-100 text-orange-800 border-orange-200",
  Cool: "bg-blue-100 text-blue-800 border-blue-200",
  Cold: "bg-gray-100 text-gray-600 border-gray-200",
};

const FIRM_TYPE_SHORT: Record<string, string> = {
  hedge_fund: "HF",
  asset_manager: "AM",
  family_office: "FO",
  pension: "Pension",
  endowment: "Endow",
  ria: "RIA",
  bank: "Bank",
  insurance: "Ins",
  corporate: "Corp",
  other: "Other",
};

function ProgressBar({
  percent,
  isOverdue,
  isConverted,
  daysElapsed,
  daysRemaining,
  conversionWindowDays,
}: {
  percent: number;
  isOverdue: boolean;
  isConverted: boolean;
  daysElapsed: number;
  daysRemaining: number;
  conversionWindowDays: number;
}) {
  let barColor = "bg-blue-500";
  let bgColor = "bg-blue-100";

  if (isConverted) {
    barColor = "bg-green-500";
    bgColor = "bg-green-100";
  } else if (isOverdue) {
    barColor = "bg-red-500";
    bgColor = "bg-red-100";
  } else if (percent >= 70) {
    barColor = "bg-amber-500";
    bgColor = "bg-amber-100";
  }

  const label = isConverted
    ? `Converted in ${daysElapsed}d`
    : isOverdue
      ? `${daysElapsed - conversionWindowDays}d overdue`
      : daysElapsed === 0
        ? "Not routed"
        : `${daysRemaining}d left`;

  return (
    <div className="w-full min-w-[120px]">
      <div className="flex items-center justify-between text-xs mb-1">
        <span
          className={clsx(
            "font-medium",
            isConverted
              ? "text-green-700"
              : isOverdue
                ? "text-red-600"
                : "text-gray-600"
          )}
        >
          {label}
        </span>
        {!isConverted && daysElapsed > 0 && (
          <span className="text-gray-400">
            {daysElapsed}/{conversionWindowDays}d
          </span>
        )}
      </div>
      <div className={clsx("h-2 rounded-full overflow-hidden", bgColor)}>
        <div
          className={clsx("h-full rounded-full transition-all duration-500", barColor)}
          style={{ width: `${Math.max(percent, 3)}%` }}
        />
      </div>
    </div>
  );
}

function TierBadge({ tier }: { tier: string }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold",
        TIER_STYLES[tier] || TIER_STYLES.Cold
      )}
    >
      {tier}
    </span>
  );
}

export function PipelineTable({ leads }: PipelineTableProps) {
  if (leads.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-gray-200 bg-white">
        <p className="text-sm text-gray-500">
          No leads found matching your filters.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Contact
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Firm
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Brand / List
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Tier
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 min-w-[160px]">
                7-Day Window
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Rep
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Created
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {leads.map((lead) => (
              <tr
                key={lead.id}
                className={clsx(
                  "transition-colors hover:bg-blue-50/50",
                  lead.isOverdue &&
                    lead.status !== "CONVERTED" &&
                    lead.status !== "STALE" &&
                    "bg-red-50/30",
                  lead.status === "CONVERTED" && "bg-green-50/30"
                )}
              >
                {/* Contact */}
                <td className="whitespace-nowrap px-4 py-3">
                  <Link href={`/leads/${lead.id}`} className="group">
                    <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600">
                      {lead.firstName} {lead.lastName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {lead.title || lead.email}
                    </p>
                  </Link>
                </td>

                {/* Firm */}
                <td className="whitespace-nowrap px-4 py-3">
                  <p className="text-sm text-gray-900">{lead.firmName}</p>
                  <div className="flex items-center gap-1.5">
                    {lead.firmType && (
                      <span className="text-xs text-gray-400">
                        {FIRM_TYPE_SHORT[lead.firmType] || lead.firmType}
                      </span>
                    )}
                    {lead.account && (
                      <span className="text-xs font-medium text-green-600">
                        Existing
                      </span>
                    )}
                  </div>
                </td>

                {/* Brand / Prospect List */}
                <td className="whitespace-nowrap px-4 py-3">
                  <p className="text-sm text-gray-700">
                    {getBrandLabel(lead.researchInterest).split(" (")[0]}
                  </p>
                  {lead.status === "CONVERTED" && lead.account?.products && lead.account.products.length > 0 && (
                    <p className="text-xs text-green-600">
                      {lead.account.products.join(", ")}
                    </p>
                  )}
                </td>

                {/* Franchise Tier */}
                <td className="whitespace-nowrap px-4 py-3">
                  <TierBadge tier={lead.scoreTier} />
                  <p className="text-xs text-gray-400 mt-0.5">
                    {lead.leadScore} pts
                  </p>
                </td>

                {/* Status */}
                <td className="whitespace-nowrap px-4 py-3">
                  <StatusBadge status={lead.status} />
                  {lead.convertedAt && (
                    <p className="text-xs text-green-600 mt-0.5">
                      {format(new Date(lead.convertedAt), "MMM d")}
                    </p>
                  )}
                </td>

                {/* 7-Day Progress */}
                <td className="px-4 py-3">
                  <ProgressBar
                    percent={lead.progressPercent}
                    isOverdue={lead.isOverdue}
                    isConverted={lead.status === "CONVERTED"}
                    daysElapsed={lead.daysElapsed}
                    daysRemaining={lead.daysRemaining}
                    conversionWindowDays={lead.conversionWindowDays}
                  />
                </td>

                {/* Rep */}
                <td className="whitespace-nowrap px-4 py-3">
                  <p className="text-sm text-gray-600">
                    {lead.assignedRep?.name || "Unassigned"}
                  </p>
                </td>

                {/* Created */}
                <td className="whitespace-nowrap px-4 py-3">
                  <p className="text-sm text-gray-500">
                    {format(new Date(lead.createdAt), "MMM d")}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(lead.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
