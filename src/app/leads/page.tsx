"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { LeadTable } from "@/components/leads/LeadTable";
import { AFFILIATE_BRANDS } from "@/lib/types";

interface LeadData {
  leads: any[];
  total: number;
  page: number;
  pageSize: number;
}

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "NEW", label: "New" },
  { value: "ROUTED", label: "Routed" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "CONVERTED", label: "Converted" },
  { value: "STALE", label: "Stale" },
];

const BRAND_OPTIONS = [
  { value: "", label: "All Brands" },
  ...Object.entries(AFFILIATE_BRANDS).map(([slug, b]) => ({
    value: slug,
    label: `${b.name} (${b.sector})`,
  })),
];

export default function LeadQueuePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState<LeadData | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [status, setStatus] = useState(searchParams.get("status") || "");
  const [brand, setBrand] = useState(searchParams.get("brand") || "");
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [sortBy, setSortBy] = useState(searchParams.get("sortBy") || "createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">((searchParams.get("sortDir") as "asc" | "desc") || "desc");
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1"));

  const loadLeads = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (brand) params.set("brand", brand);
    if (search) params.set("search", search);
    params.set("sortBy", sortBy);
    params.set("sortDir", sortDir);
    params.set("page", page.toString());
    params.set("pageSize", "25");

    try {
      const res = await fetch(`/api/leads?${params}`);
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch (err) {
      console.error("Failed to load leads:", err);
    } finally {
      setLoading(false);
    }
  }, [status, brand, search, sortBy, sortDir, page]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  function handleSort(field: string) {
    if (sortBy === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortDir("desc");
    }
    setPage(1);
  }

  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Lead Queue</h1>
        <p className="text-sm text-gray-500">
          {data ? `${data.total} lead${data.total !== 1 ? "s" : ""}` : "Loading..."} across all territories
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            placeholder="Search contacts, firms..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <select
          value={brand}
          onChange={(e) => { setBrand(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {BRAND_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        {(status || brand || search) && (
          <button
            onClick={() => { setStatus(""); setBrand(""); setSearch(""); setPage(1); }}
            className="text-sm font-medium text-gray-500 hover:text-gray-700"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-3 border-blue-600 border-t-transparent" />
        </div>
      ) : data ? (
        <>
          <LeadTable
            leads={data.leads}
            sortBy={sortBy}
            sortDir={sortDir}
            onSort={handleSort}
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing {(page - 1) * data.pageSize + 1}â{Math.min(page * data.pageSize, data.total)} of {data.total}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
