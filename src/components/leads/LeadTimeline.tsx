"use client";

import { StatusBadge } from "@/components/ui/Badge";
import { format } from "date-fns";

interface StatusChange {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  changedBy: string | null;
  reason: string | null;
  createdAt: string;
}

interface Note {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}

type TimelineItem =
  | { type: "status"; data: StatusChange }
  | { type: "note"; data: Note };

export function LeadTimeline({
  statusChanges,
  notes,
}: {
  statusChanges: StatusChange[];
  notes: Note[];
}) {
  const items: TimelineItem[] = [
    ...statusChanges.map((sc) => ({ type: "status" as const, data: sc })),
    ...notes.map((n) => ({ type: "note" as const, data: n })),
  ].sort((a, b) => new Date(b.data.createdAt).getTime() - new Date(a.data.createdAt).getTime());
  if (items.length === 0) return <p className="text-sm text-gray-500">No activity yet.</p>;
  return (<div className="flow-root"><ul className="-mb-8">{items.map((item, idx) => (<li key={item.data.id}><div className="relative pb-8">{idx < items.length - 1 && <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200" />}<div className="relative flex items-start space-x-3">{item.type==="status"?(<><div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 ring-4 ring-white"><svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" /></svg></div><div className="min-w-0 flex-1"><div className="flex items-center gap-2">{(item.data as StatusChange).fromStatus && (<><StatusBadge status={(item.data as StatusChange).fromStatus!} /><span className="text-gray-400">â</span></>)}<StatusBadge status={(item.data as StatusChange).toStatus} /></div>{(item.data as StatusChange).reason && <p className="mt-1 text-sm text-gray-600">{(item.data as StatusChange).reason}</p>}<p className="mt-1 text-xs text-gray-400">{(item.data as StatusChange).changedBy || "System"} â¢{" "}{format(new Date(item.data.createdAt), "MMM d, yyyy h:mm a")}</p></div></>):(<><div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 ring-4 ring-white"><svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" /></svg></div><div className="min-w-0 flex-1"><p className="text-sm text-gray-800">{(item.data as Note).content}</p><p className="mt-1 text-xs text-gray-400">{(item.data as Note).author} â¢{" "}{format(new Date(item.data.createdAt), "MMM d, yyyy h:mm a")}</p></div></>)}</div></div></li>))}</ul></div>);
}
