"use client";

import { clsx } from "clsx";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "purple";
  className?: string;
}

const variantClasses = {
  default: "bg-gray-100 text-gray-700",
  success: "bg-green-100 text-green-700",
  warning: "bg-yellow-100 text-yellow-700",
  danger: "bg-red-100 text-red-700",
  info: "bg-blue-100 text-blue-700",
  purple: "bg-purple-100 text-purple-700",
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

// Convenience: status badge
export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: BadgeProps["variant"] }> = {
    NEW: { label: "New", variant: "info" },
    ROUTED: { label: "Routed", variant: "warning" },
    CONTACTED: { label: "Contacted", variant: "purple" },
    CONVERTED: { label: "Converted", variant: "success" },
    STALE: { label: "Stale", variant: "danger" },
  };

  const info = map[status] || { label: status, variant: "default" as const };
  return <Badge variant={info.variant}>{info.label}</Badge>;
}

// Score badge
export function ScoreBadge({ score }: { score: number }) {
  let variant: BadgeProps["variant"] = "default";
  let label = "Cold";
  if (score >= 75) { variant = "danger"; label = "Hot"; }
  else if (score >= 50) { variant = "warning"; label = "Warm"; }
  else if (score >= 25) { variant = "info"; label = "Cool"; }

  return (
    <Badge variant={variant}>
      {score} â {label}
    </Badge>
  );
}
