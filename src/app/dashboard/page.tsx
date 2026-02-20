"use client";

import { useEffect, useState, useCallback } from "react";
import type { DashboardStats, Lead, LeadStatus } from "@/types";
import { Header } from "@/components/layout/header";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { LeadTable } from "@/components/dashboard/lead-table";
import { RoutingChart } from "@/components/dashboard/routing-chart";
import { syncFromCrm, CrmSyncResult } from "@/lib/crm-sync";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [totalLeads, setTotalLeads] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState("");
  const [syncResult, setSyncResult] = useState<CrmSyncResult | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter states
  const [selectedStatus, setSelectedStatus] = useState<LeadStatus[]>([]);
  const [selectedFranchise, setSelectedFranchise] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const statsRes = await fetch("/api/stats");
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.data);
      }

      const params = new URLSearchParams();
      if (selectedStatus.length > 0) params.append("status", selectedStatus.join(","));
      if (selectedFranchise.length > 0) params.append("franchise", selectedFranchise.join(","));
      if (searchQuery) params.append("search", searchQuery);
      params.append("limit", "50");
      params.append("page", String(page));

      const leadsRes = await fetch(`/api/leads?${params.toString()}`);
      if (leadsRes.ok) {
        const leadsData = await leadsRes.json();
        setLeads(leadsData.data.data);
        setTotalLeads(leadsData.data.total);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedStatus, selectedFranchise, searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
    fetchData(1);
  }, [fetchData]);

  const handleSyncClick = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    setSyncProgress("Connecting to CRM...");
    try {
      const result = await syncFromCrm({
        replace: true,
        onProgress: (fetched, total) => {
          setSyncProgress(`Fetching ${fetched} of ${total}...`);
        },
      });
      setSyncResult(result);
      if (result.success) {
        setSyncProgress(`Imported ${result.total} leads`);
        await fetchData(1);
      } else {
        setSyncProgress(result.error || "Sync failed");
      }
    } catch (error) {
      console.error("Error syncing from CRM:", error);
      setSyncProgress("Sync failed");
    } finally {
      setIsSyncing(false);
      // Clear progress after 5s
      setTimeout(() => setSyncProgress(""), 5000);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchData(page);
  };

  // Get franchise options from stats data
  const franchiseOptions = stats
    ? Object.keys(stats.leadsPerFranchise).filter((f) => f !== "Unassigned").sort()
    : [];

  const statusOptions: LeadStatus[] = ["new", "qualified", "routed", "converted", "lost"];
  const totalPages = Math.ceil(totalLeads / 50);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Header
        onSyncClick={handleSyncClick}
        isSyncing={isSyncing}
        syncProgress={syncProgress}
        lastSyncedAt={stats?.lastSyncedAt}
      />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Sync Result Banner */}
        {syncResult && (
          <div
            className={`mb-6 rounded-lg border px-4 py-3 text-sm ${
              syncResult.success
                ? "border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300"
                : "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300"
            }`}
          >
            {syncResult.success
              ? `CRM sync complete: ${syncResult.imported} new leads imported, ${syncResult.updated} updated. Total: ${syncResult.total} leads.`
              : `CRM sync failed: ${syncResult.error}`}
            <button
              onClick={() => setSyncResult(null)}
              className="ml-3 font-medium underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && stats && stats.totalLeads === 0 && (
          <div className="mb-8 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
              No leads yet
            </h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Click <strong>Sync from CRM</strong> to import leads from the Analyst Hub CRM.
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
              Make sure you are logged into crm.analysthub.com first.
            </p>
          </div>
        )}

        {/* Stats Section */}
        {stats && stats.totalLeads > 0 && (
          <div className="mb-8">
            <StatsCards stats={stats} />
          </div>
        )}

        {/* Charts and Filters Section */}
        {stats && stats.totalLeads > 0 && (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              {/* Filters */}
              <div className="mb-6 card">
                <div className="card-body">
                  <div className="grid gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Search
                      </label>
                      <input
                        type="text"
                        placeholder="Search by name, email, company, or franchise..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="input"
                      />
                    </div>

                    {/* Franchise Filter */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Franchise
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {franchiseOptions.map((franchise) => (
                          <button
                            key={franchise}
                            onClick={() =>
                              setSelectedFranchise((prev) =>
                                prev.includes(franchise)
                                  ? prev.filter((f) => f !== franchise)
                                  : [...prev, franchise]
                              )
                            }
                            className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
                              selectedFranchise.includes(franchise)
                                ? "bg-brand-600 text-white"
                                : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700"
                            }`}
                          >
                            {franchise}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Status Filter */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Status
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {statusOptions.map((status) => (
                          <button
                            key={status}
                            onClick={() =>
                              setSelectedStatus((prev) =>
                                prev.includes(status)
                                  ? prev.filter((s) => s !== status)
                                  : [...prev, status]
                              )
                            }
                            className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
                              selectedStatus.includes(status)
                                ? "bg-brand-600 text-white"
                                : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700"
                            }`}
                          >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lead Table */}
              <LeadTable leads={leads} isLoading={isLoading} />

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Showing {(currentPage - 1) * 50 + 1}-{Math.min(currentPage * 50, totalLeads)} of {totalLeads} leads
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage <= 1}
                      className="btn btn-secondary btn-sm disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= totalPages}
                      className="btn btn-secondary btn-sm disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div>
              <RoutingChart stats={stats} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
