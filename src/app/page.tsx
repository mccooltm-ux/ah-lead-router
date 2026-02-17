"use client";

import { useEffect, useState } from "react";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { DashboardCharts } from "@/components/dashboard/Charts";
import { StatusBreakdown } from "@/components/dashboard/StatusBreakdown";
import { StaleAlerts } from "@/components/dashboard/StaleAlerts";
import type { DashboardStats } from "@/lib/types";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [staleLeads, setStaleLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    try {
      setLoading(true);
      const [statsRes, leadsRes] = await Promise.all([
        fetch("/api/stats"),
        fetch("/api/leads?status=STALE&pageSize=10"),
      ]);

      const statsData = await statsRes.json();
      const leadsData = await leadsRes.json();

      if (statsData.success) setStats(statsData.data);
      if (leadsData.success) setStaleLeads(leadsData.data.leads || []);
      setError(null);
    } catch (err) {
      setError("Failed to load dashboard data. Have you seeded the database?");
    } finally {
      setLoading(false);
    }
  }

  async function seedDatabase() {
    try {
      setSeeding(true);
      const res = await fetch("/api/demo/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reset: true }),
      });
      const data = await res.json();
      if (data.success) {
        await loadData();
      } else {
        setError(`Seeding failed: ${data.error}`);
      }
    } catch (err) {
      setError("Failed to seed database. Check the console for details.");
    } finally {
      setSeeding(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="mt-3 text-sm text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
          </svg>
          <h2 className="mt-4 text-lg font-semibold text-gray-900">No Data Yet</h2>
          <p className="mt-1 text-sm text-gray-500">
            {error || "Seed the database with demo data to get started."}
          </p>
          <button
            onClick={seedDatabase}
            disabled={seeding}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {seeding ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Seeding...
              </>
            ) : (
              "Seed Demo Data"
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">Lead routing & conversion overview</p>
        </div>
        <button
          onClick={loadData}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <SummaryCards stats={stats} />

      {/* Charts + Status */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DashboardCharts
            leadsByBrand={stats.leadsByBrand}
            leadsByTerritory={stats.leadsByTerritory}
          />
        </div>
        <div className="space-y-6">
          <StatusBreakdown leadsByStatus={stats.leadsByStatus} />
          <StaleAlerts leads={staleLeads} />
        </div>
      </div>
    </div>
  );
}
