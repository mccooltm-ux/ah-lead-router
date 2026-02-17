"use client";

import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import type { LeadStatusType } from "@/lib/types";

interface StatusBreakdownProps {
  leadsByStatus: Record<LeadStatusType, number>;
}

const STATUS_ORDER: LeadStatusType[] = ["NEW", "ROUTED", "CONTACTED", "CONVERTED", "STALE"];

export function StatusBreakdown({ leadsByStatus }: StatusBreakdownProps) {
  const total = Object.values(leadsByStatus).reduce((a, b) => a + b, 0);

  return (
    <Card>
      <h3 className="text-sm font-semibold text-gray-900">Pipeline Breakdown</h3>
      <div className="mt-4 space-y-3">
        {STATUS_ORDER.map((status) => {
          const count = leadsByStatus[status] || 0;
          const pct = total > 0 ? (count / total) * 100 : 0;
          return (
            <div key={status} className="flex items-center gap-3">
              <div className="w-24">
                <StatusBadge status={status} />
              </div>
              <div className="flex-1">
                <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={`h-full rounded-full transition-all ${
                      status === "NEW" ? "bg-blue-400" :
                      status === "ROUTED" ? "bg-yellow-400" :
                      status === "CONTACTED" ? "bg-purple-400" :
                      status === "CONVERTED" ? "bg-green-400" :
                      "bg-red-400"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
              <span className="w-12 text-right text-sm font-medium text-gray-700">
                {count}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-4 border-t pt-3 text-center text-sm text-gray-500">
        {total} total leads
      </div>
    </Card>
  );
}
