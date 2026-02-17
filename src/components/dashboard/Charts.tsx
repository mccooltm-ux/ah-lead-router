"use client";

import { Card } from "@/components/ui/Card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { getBrandLabel } from "@/lib/config/brands";

const BRAND_COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
  "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#84cc16", "#06b6d4",
];

const TERRITORY_COLORS = [
  "#2563eb", "#16a34a", "#d97706", "#dc2626",
];

interface ChartProps {
  leadsByBrand: { brand: string; count: number }[];
  leadsByTerritory: { territory: string; count: number }[];
}

export function BrandChart({ data }: { data: { brand: string; count: number }[] }) {
  const chartData = data.map((d) => ({
    name: getBrandLabel(d.brand).split(" (")[0], // just brand name
    count: d.count,
    fullName: getBrandLabel(d.brand),
  }));

  return (
    <Card>
      <h3 className="mb-4 text-sm font-semibold text-gray-900">Leads by Affiliate Brand</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: "#64748b" }}
              angle={-30}
              textAnchor="end"
              height={60}
            />
            <YAxis tick={{ fontSize: 11, fill: "#64748b" }} allowDecimals={false} />
            <Tooltip
              formatter={(value: number) => [value, "Leads"]}
              contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {chartData.map((_entry, index) => (
                <Cell key={`cell-${index}`} fill={BRAND_COLORS[index % BRAND_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export function TerritoryChart({ data }: { data: { territory: string; count: number }[] }) {
  return (
    <Card>
      <h3 className="mb-4 text-sm font-semibold text-gray-900">Leads by Territory</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="territory"
              tick={{ fontSize: 11, fill: "#64748b" }}
              angle={-15}
              textAnchor="end"
              height={50}
            />
            <YAxis tick={{ fontSize: 11, fill: "#64748b" }} allowDecimals={false} />
            <Tooltip
              formatter={(value: number) => [value, "Leads"]}
              contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {data.map((_entry, index) => (
                <Cell key={`cell-${index}`} fill={TERRITORY_COLORS[index % TERRITORY_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export function DashboardCharts({ leadsByBrand, leadsByTerritory }: ChartProps) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <BrandChart data={leadsByBrand} />
      <TerritoryChart data={leadsByTerritory} />
    </div>
  );
}
