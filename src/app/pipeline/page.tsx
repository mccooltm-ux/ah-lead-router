"use client";

import { useEffect, useState, useCallback } from "react";
import { PipelineTable } from "@/components/leads/PipelineTable";
import { AFFILIATE_BRANDS } from "@/lib/types";
import { clsx } from "clsx";

interface PipelineData {
  leads: any[];
  summary: {
    total: number;
    byStatus: Record<string, number>;
    overdue: number;
    avgDaysToConvert: number | null;
  };
}

const STATUS_FILTERS = [
  { value: "", label: "All" },
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
    label: b.name,
  })),
];

function SummaryCard({
  label,
  value,
  subtext,
  color,
}: {
  label: string;
  value: string | number;
  subtext?: string;
  color?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-5 py-4">
      <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
        {label}
      </p>
      <p
        className={clsx(
          "mt-1 text-2xl font-bold",
          color || "text-gray-900"
        )}
      >
        {value}
      </p>
      {subtext && <p className="mt-0.5 text-xs text-gray-400">{subtext}</p>}
    </div>
  );
}

export default function PipelinePage() {
  const [data, setData] = useState<PipelineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [brand, setBrand] = useState("");
  const [search, setSearch] = useState("");

  const loadPipeline = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("days", "30");
    if (status) params.set("status", status);
    if (brand) params.set("brand", brand);
    if (search) params.set("search", search);

    try {
      const res = await fetch(`/api/leads/pipeline?${params}`);
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch (err) {
      console.error("Failed to load pipeline:", err);
    } finally {
      setLoading(false);
    }
  }, [status, brand, search]);

  useEffect(() => {
    loadPipeline();
  }, [loadPipeline]);

  // Auto-refresh every 60s
  useEffect(() => {
    const interval = setInterval(loadPipeline, 60000);
    return () => clearInterval(interval);
  }, [loadPipeline]);

  const summary = data?.summary;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lead Pipeline</h1>
          <p className="text-sm text-gray-500">
            Past 30 days &middot; 7-day conversion window tracking
          </p>
        </div>
        <button
          onClick={loadPipeline}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182"
            />
          </svg>
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <SummaryCard
            label="Total Leads"
            value={summary.total}
            subtext="Past 30 days"
          />
          <SummaryCard
            label="In Progress"
            value={
              summary.byStatus.ROUTED + summary.byStatus.CONTACTED
            }
            subtext="Routed + Contacted"
            color="text-blue-600"
          />
          <SummaryCard
            label="Converted"
            value={summary.byStatus.CONVERTED}
            subtext={
              summary.avgDaysToConvert
                ? `Avg ${summary.avgDaysToConvert}d to convert`
                : "No conversions yet"
            }
            color="text-green-600"
          />
          <SummaryCard
            label="Overdue"
            value={summary.overdue}
            subtext="Past 7-day window"
            color={summary.overdue > 0 ? "text-red-600" : "text-gray-900"}
          />
          <SummaryCard
            label="Awaiting Routing"
            value={summary.byStatus.NEW}
            subtext="Not yet assigned"
            color={
              summary.byStatus.NEW > 0 ? "text-amber-600" : "text-gray-900"
            }
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search contacts, firms..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Status pill toggles */}
        <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1">
          {STATUS_FILTERS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatus(opt.value)}
              className={clsx(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                status === opt.value
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              {opt.label}
              {summary && opt.value && (
                <span className="ml-1 opacity-70">
                  {summary.byStatus[opt.value] ?? 0}
                </span>
              )}
            </button>
          ))}
        </div>

        <select
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {BRAND_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {(status || brand || search) && (
          <button
            onClick={() => {
              setStatus("");
              setBrand("");
              setSearch("");
            }}
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
        <PipelineTable leads={data.leads} />
      ) : null}
    </div>
  );
}
