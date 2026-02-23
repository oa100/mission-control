"use client";

import { useState } from "react";

interface Integration {
  id: string;
  name: string;
  icon: string;
  status: "healthy" | "degraded" | "down" | "unknown";
  message: string;
  checkedAt: string;
}

const statusBadge: Record<Integration["status"], { label: string; dot: string; bg: string }> = {
  healthy: { label: "Healthy", dot: "bg-green-500", bg: "bg-green-900/20 text-green-400" },
  degraded: { label: "Degraded", dot: "bg-yellow-500", bg: "bg-yellow-900/20 text-yellow-400" },
  down: { label: "Down", dot: "bg-red-500", bg: "bg-red-900/20 text-red-400" },
  unknown: { label: "Unknown", dot: "bg-zinc-500", bg: "bg-zinc-700/50 text-zinc-400" },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

export default function IntegrationCard({ integration }: { integration: Integration }) {
  const [expanded, setExpanded] = useState(false);
  const badge = statusBadge[integration.status];

  return (
    <button
      onClick={() => setExpanded(!expanded)}
      className="w-full text-left p-4 rounded-lg border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 transition-colors"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{integration.icon}</span>
          <span className="font-semibold">{integration.name}</span>
        </div>
        <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-xs ${badge.bg}`}>
          <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
          {badge.label}
        </span>
      </div>
      <div className="text-xs text-zinc-500">Checked {timeAgo(integration.checkedAt)}</div>
      {expanded && integration.status !== "healthy" && (
        <div className="mt-2 p-2 rounded bg-zinc-950 text-xs font-mono text-zinc-400">
          {integration.message}
        </div>
      )}
    </button>
  );
}
