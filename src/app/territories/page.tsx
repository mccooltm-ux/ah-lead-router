"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { US_STATE_NAMES, CA_PROVINCE_NAMES } from "@/lib/config/territories";

interface Territory {
  id: string;
  name: string;
  regions: string[];
  country: string;
  rep: { id: string; name: string; email: string } | null;
}

interface Rep {
  id: string;
  name: string;
  email: string;
  _count: { leads: number; accounts: number };
}

export default function TerritoriesPage() {
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [reps, setReps] = useState<Rep[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  async function loadData() {
    try {
      const [tRes, rRes] = await Promise.all([
        fetch("/api/territories"),
        fetch("/api/reps"),
      ]);
      const tData = await tRes.json();
      const rData = await rRes.json();

      if (tData.success) setTerritories(tData.data);
      if (rData.success) setReps(rData.data);
    } catch (err) {
      console.error("Failed to load territories:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleAssign(territoryId: string, repId: string) {
    setUpdating(territoryId);
    try {
      await fetch("/api/territories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ territoryId, repId: repId || null }),
      });
      await loadData();
    } catch (err) {
      console.error("Failed to update territory:", err);
    } finally {
      setUpdating(null);
    }
  }

  function getRegionLabel(code: string): string {
    return US_STATE_NAMES[code] || CA_PROVINCE_NAMES[code] || code;
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Territory Management</h1>
        <p className="text-sm text-gray-500">
          Assign sales reps to geographic territories
        </p>
      </div>

      {/* Rep Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {reps.map((rep) => (
          <Card key={rep.id}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
                {rep.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{rep.name}</p>
                <p className="text-xs text-gray-500">
                  {rep._count.leads} leads â¢ {rep._count.accounts} accounts
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Territory Cards */}
      <div className="space-y-4">
        {territories.map((territory) => {
          const usRegions = territory.regions.filter((r) => US_STATE_NAMES[r]);
          const caRegions = territory.regions.filter((r) => CA_PROVINCE_NAMES[r]);

          return (
            <Card key={territory.id}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {territory.name}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {territory.regions.length} regions
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={territory.rep?.id || ""}
                    onChange={(e) => handleAssign(territory.id, e.target.value)}
                    disabled={updating === territory.id}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Unassigned</option>
                    {reps.map((rep) => (
                      <option key={rep.id} value={rep.id}>
                        {rep.name}
                      </option>
                    ))}
                  </select>
                  {updating === territory.id && (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                  )}
                </div>
              </div>

              {/* US States */}
              {usRegions.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 text-xs font-medium text-gray-500">US States</p>
                  <div className="flex flex-wrap gap-1.5">
                    {usRegions.map((code) => (
                      <Badge key={code} variant="info">
                        {code}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Canadian Provinces */}
              {caRegions.length > 0 && (
                <div className="mt-3">
                  <p className="mb-2 text-xs font-medium text-gray-500">Canadian Provinces</p>
                  <div className="flex flex-wrap gap-1.5">
                    {caRegions.map((code) => (
                      <Badge key={code} variant="purple">
                        {code}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Assigned Rep */}
              {territory.rep && (
                <div className="mt-4 flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2">
                  <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                  <span className="text-sm text-green-700">
                    Assigned to <strong>{territory.rep.name}</strong> ({territory.rep.email})
                  </span>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {territories.length === 0 && (
        <Card>
          <div className="py-8 text-center">
            <p className="text-sm text-gray-500">
              No territories configured. Seed the demo data to get started.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
