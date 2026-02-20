"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { DashboardStats } from "@/types";

interface RoutingChartProps {
  stats: DashboardStats;
}

// Color palette for franchise bars
const FRANCHISE_COLORS: Record<string, string> = {
  "Sankey Research": "#0ea5e9",
  "FFTT": "#8b5cf6",
  "GLJ Research": "#10b981",
  "The Schneider Capital Group": "#f59e0b",
  "Optimal Advisory": "#ef4444",
  "Heather Jones Research": "#ec4899",
  "Fox Advisors": "#06b6d4",
  "Rubinson Research": "#84cc16",
  "Kalinowski Equity Research": "#f97316",
  "Fermium Research": "#6366f1",
  "IronAdvisor Insights": "#14b8a6",
  "Sakonnet Research": "#a855f7",
  "Brogan Group Equity Research": "#78716c",
  "Cannonball Research": "#d946ef",
};

export function RoutingChart({ stats }: RoutingChartProps) {
  const data = Object.entries(stats.leadsPerFranchise)
    .filter(([name]) => name !== "Unassigned")
    .map(([name, leads]) => ({
      name: name.length > 18 ? name.substring(0, 16) + "..." : name,
      fullName: name,
      leads,
      fill: FRANCHISE_COLORS[name] || "#94a3b8",
    }))
    .sort((a, b) => b.leads - a.leads);

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Leads by Franchise
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {Object.keys(stats.leadsPerFranchise).filter(f => f !== "Unassigned").length} active franchises
        </p>
      </div>
      <div className="card-body">
        <ResponsiveContainer width="100%" height={Math.max(300, data.length * 32)}>
          <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 11 }}
              width={130}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "1px solid #475569",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "#f1f5f9" }}
              formatter={(value: number) => [value, "Leads"]}
              labelFormatter={(label: string) => {
                const item = data.find(d => d.name === label);
                return item?.fullName || label;
              }}
            />
            <Bar dataKey="leads" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <rect key={index} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tier breakdown */}
      {stats.leadsPerTier && Object.keys(stats.leadsPerTier).length > 0 && (
        <div className="border-t border-slate-200 dark:border-slate-800">
          <div className="card-body">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
              Leads by Tier
            </h3>
            <div className="space-y-2">
              {Object.entries(stats.leadsPerTier)
                .sort(([, a], [, b]) => b - a)
                .map(([tier, count]) => (
                  <div key={tier} className="flex items-center justify-between">
                    <span className="text-xs text-slate-600 dark:text-slate-400">
                      {tier}
                    </span>
                    <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      {count}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
