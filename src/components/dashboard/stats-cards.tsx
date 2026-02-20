"use client";

import type { DashboardStats } from "@/types";
import { Users, Activity, CheckCircle, TrendingUp } from "lucide-react";

interface StatsCardsProps {
  stats: DashboardStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const franchiseCount = Object.keys(stats.leadsPerFranchise).filter(
    (f) => f !== "Unassigned"
  ).length;

  const cards = [
    {
      label: "Total Leads",
      value: stats.totalLeads,
      icon: Users,
      color: "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400",
    },
    {
      label: "Franchises",
      value: franchiseCount,
      icon: Activity,
      color: "bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400",
    },
    {
      label: "Qualified",
      value: stats.qualifiedLeads,
      icon: CheckCircle,
      color: "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400",
    },
    {
      label: "New Leads",
      value: stats.totalLeads - stats.qualifiedLeads - stats.convertedLeads,
      icon: TrendingUp,
      color: "bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.label} className="card overflow-hidden">
            <div className="card-body">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    {card.label}
                  </p>
                  <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {card.value}
                  </p>
                </div>
                <div className={`rounded-lg p-3 ${card.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
