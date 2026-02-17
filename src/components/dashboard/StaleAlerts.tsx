"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface StaleLead {
  id: string;
  firstName: string;
  lastName: string;
  firmName: string;
  researchInterest: string;
  assignedRep?: { name: string } | null;
  staleAt: string | null;
  routedAt: string | null;
}

export function StaleAlerts({ leads }: { leads: StaleLead[] }) {
  if (leads.length === 0) {
    return (
      <Card>
        <div className="flex items-center gap-2">
          <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          <h3 className="text-sm font-semibold text-gray-900">Stale Lead Alerts</h3>
        </div>
        <p className="mt-2 text-sm text-gray-500">No stale leads â all clear!</p>
      </Card>
    );
  }

  return (
    <Card padding={false}>
      <div className="flex items-center gap-2 border-b border-gray-200 px-6 py-4">
        <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
        </svg>
        <h3 className="text-sm font-semibold text-gray-900">
          Stale Lead Alerts
        </h3>
        <Badge variant="danger">{leads.length}</Badge>
      </div>
      <div className="divide-y divide-gray-100">
        {leads.slice(0, 5).map((lead) => {
          const daysSinceRouted = lead.routedAt
            ? Math.floor((Date.now() - new Date(lead.routedAt).getTime()) / 86400000)
            : 0;
          return (
            <Link
              key={lead.id}
              href={`/leads/${lead.id}`}
              className="flex items-center justify-between px-6 py-3 transition-colors hover:bg-gray-50"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {lead.firstName} {lead.lastName}
                </p>
                <p className="text-xs text-gray-500">
                  {lead.firmName} â¢ {lead.researchInterest}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium text-red-600">
                  {daysSinceRouted}d since routed
                </p>
                <p className="text-xs text-gray-400">
                  {lead.assignedRep?.name || "Unassigned"}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
      {leads.length > 5 && (
        <div className="border-t border-gray-100 px-6 py-3 text-center">
          <Link href="/leads?status=STALE" className="text-sm font-medium text-blue-600 hover:text-blue-700">
            View all {leads.length} stale leads â
          </Link>
        </div>
      )}
    </Card>
  );
}
