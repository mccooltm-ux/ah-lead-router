"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { StatusBadge, ScoreBadge, Badge } from "@/components/ui/Badge";
import { LeadTimeline } from "@/components/leads/LeadTimeline";
import { getBrandLabel } from "@/lib/config/brands";
import { FIRM_TYPE_LABELS } from "@/lib/types";
import type { FirmType } from "@/lib/types";
import { format } from "date-fns";

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [lead, setLead] = useState<any>(null);
  const [reps, setReps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [newStatus, setNewStatus] = useState("");

  async function loadLead() {
    try {
      const [leadRes, repsRes] = await Promise.all([
        fetch(`/api/leads/${id}`),
        fetch("/api/reps"),
      ]);
      const leadData = await leadRes.json();
      const repsData = await repsRes.json();

      if (leadData.success) setLead(leadData.data);
      if (repsData.success) setReps(repsData.data);
    } catch (err) {
      console.error("Failed to load lead:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLead();
  }, [id]);

  async function handleStatusUpdate() {
    if (!newStatus) return;
    setUpdating(true);
    try {
      await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, changedBy: "User" }),
      });
      setNewStatus("");
      await loadLead();
    } catch (err) {
      alert("Failed to update status");
    } finally {
      setUpdating(false);
    }
  }

  async function handleAddNote() {
    if (!newNote.trim()) return;
    setUpdating(true);
    try {
      await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: newNote, noteAuthor: "User" }),
      });
      setNewNote("");
      await loadLead();
    } catch (err) {
      alert("Failed to add note");
    } finally {
      setUpdating(false);
    }
  }

  async function handleReassign(repId: string) {
    setUpdating(true);
    try {
      await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignToRepId: repId, changedBy: "User" }),
      });
      await loadLead();
    } catch (err) {
      alert("Failed to reassign lead");
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <p className="text-gray-500">Lead not found.</p>
      </div>
    );
  }

  const NEXT_STATUSES: Record<string, string[]> = {
    NEW: ["ROUTED"],
    ROUTED: ["CONTACTED"],
    CONTACTED: ["CONVERTED"],
    STALE: ["ROUTED", "CONTACTED"],
    CONVERTED: [],
  };

  const possibleNext = NEXT_STATUSES[lead.status] || [];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/leads" className="hover:text-blue-600">Lead Queue</Link>
        <span>/</span>
        <span className="text-gray-900">
          {lead.firstName} {lead.lastName}
        </span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {lead.firstName} {lead.lastName}
          </h1>
          <p className="text-gray-500">
            {lead.title ? `${lead.title} at ` : ""}{lead.firmName}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={lead.status} />
          <ScoreBadge score={lead.leadScore} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Contact & Firm Info */}
          <Card>
            <h3 className="text-sm font-semibold text-gray-900">Contact Information</h3>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-gray-500">Email</p>
                <p className="text-sm text-gray-900">{lead.email}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Phone</p>
                <p className="text-sm text-gray-900">{lead.phone || "â"}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Firm</p>
                <p className="text-sm text-gray-900">{lead.firmName}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Firm Type</p>
                <p className="text-sm text-gray-900">
                  {lead.firmType ? FIRM_TYPE_LABELS[lead.firmType as FirmType] || lead.firmType : "â"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Location</p>
                <p className="text-sm text-gray-900">
                  {[lead.city, lead.state, lead.country].filter(Boolean).join(", ") || "â"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">AUM</p>
                <p className="text-sm text-gray-900">
                  {lead.aum ? `$${lead.aum.toLocaleString()}M` : "â"}
                </p>
              </div>
            </div>
          </Card>

          {/* Registration Details */}
          <Card>
            <h3 className="text-sm font-semibold text-gray-900">Registration Details</h3>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-gray-500">Research Interest</p>
                <p className="text-sm text-gray-900">{getBrandLabel(lead.researchInterest)}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Registration Type</p>
                <p className="text-sm capitalize text-gray-900">{lead.registrationType.replace("_", " ")}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Source</p>
                <p className="text-sm capitalize text-gray-900">{lead.source || "â"}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Received</p>
                <p className="text-sm text-gray-900">
                  {format(new Date(lead.createdAt), "MMM d, yyyy h:mm a")}
                </p>
              </div>
            </div>
          </Card>

          {/* Account Intelligence */}
          {lead.account && (
            <Card>
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
                </svg>
                <h3 className="text-sm font-semibold text-gray-900">Existing Account</h3>
              </div>
              <p className="mt-2 text-sm text-gray-600">
                This contact is from <strong>{lead.account.firmName}</strong>, an existing {lead.account.status} account.
              </p>
            </Card>
          )}

          {/* Score Breakdown */}
          {lead.scoreBreakdown && (
            <Card>
              <h3 className="text-sm font-semibold text-gray-900">Score Breakdown</h3>
              <div className="mt-4 space-y-2">
                {Object.entries(lead.scoreBreakdown as Record<string, number>)
                  .filter(([key]) => key !== "total")
                  .map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-sm capitalize text-gray-600">
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-100">
                          <div
                            className="h-full rounded-full bg-blue-500"
                            style={{ width: `${(Number(value) / 25) * 100}%` }}
                          />
                        </div>
                        <span className="w-8 text-right text-sm font-medium text-gray-700">{value}</span>
                      </div>
                    </div>
                  ))}
                <div className="border-t pt-2">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-sm text-gray-900">Total Score</span>
                    <span className="text-sm text-gray-900">{(lead.scoreBreakdown as Record<string, number>).total}</span>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Activity Timeline */}
          <Card>
            <h3 className="mb-4 text-sm font-semibold text-gray-900">Activity Timeline</h3>
            <LeadTimeline
              statusChanges={lead.statusChanges || []}
              notes={lead.notes || []}
            />
          </Card>
        </div>

        {/* Sidebar actions */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <h3 className="text-sm font-semibold text-gray-900">Actions</h3>

            {/* Status update */}
            {possibleNext.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-medium text-gray-500">Update Status</p>
                <div className="flex flex-wrap gap-2">
                  {possibleNext.map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setNewStatus(s);
                        setTimeout(() => {
                          // auto-submit
                          fetch(`/api/leads/${id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ status: s, changedBy: "User" }),
                          }).then(() => loadLead());
                        }, 0);
                      }}
                      disabled={updating}
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
                    >
                      Mark as {s.charAt(0) + s.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Reassign */}
            <div className="mt-4">
              <p className="mb-2 text-xs font-medium text-gray-500">Assign to Rep</p>
              <select
                value={lead.assignedRepId || ""}
                onChange={(e) => handleReassign(e.target.value)}
                disabled={updating}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Unassigned</option>
                {reps.map((rep: any) => (
                  <option key={rep.id} value={rep.id}>
                    {rep.name}
                  </option>
                ))}
              </select>
            </div>
          </Card>

          {/* Routing Info */}
          <Card>
            <h3 className="text-sm font-semibold text-gray-900">Routing</h3>
            <div className="mt-3 space-y-3">
              <div>
                <p className="text-xs font-medium text-gray-500">Assigned Rep</p>
                <p className="text-sm text-gray-900">{lead.assignedRep?.name || "Unassigned"}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Territory</p>
                <p className="text-sm text-gray-900">{lead.territoryMatch || "â"}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Routed At</p>
                <p className="text-sm text-gray-900">
                  {lead.routedAt ? format(new Date(lead.routedAt), "MMM d, yyyy h:mm a") : "â"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Contacted At</p>
                <p className="text-sm text-gray-900">
                  {lead.contactedAt ? format(new Date(lead.contactedAt), "MMM d, yyyy h:mm a") : "â"}
                </p>
              </div>
            </div>
          </Card>

          {/* Add Note */}
          <Card>
            <h3 className="text-sm font-semibold text-gray-900">Add Note</h3>
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Add a note about this lead..."
              className="mt-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              rows={3}
            />
            <button
              onClick={handleAddNote}
              disabled={!newNote.trim() || updating}
              className="mt-2 w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              Add Note
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
}
