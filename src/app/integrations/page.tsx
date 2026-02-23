"use client";

import { useEffect, useState, useCallback } from "react";
import IntegrationCard from "@/components/IntegrationCard";

interface Integration {
  id: string;
  name: string;
  icon: string;
  status: "healthy" | "degraded" | "down" | "unknown";
  message: string;
  checkedAt: string;
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchIntegrations = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    try {
      const res = await fetch("/api/integrations");
      const data = await res.json();
      setIntegrations(data.integrations || []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchIntegrations(); }, [fetchIntegrations]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => fetchIntegrations(), 300_000);
    return () => clearInterval(interval);
  }, [fetchIntegrations]);

  const healthy = integrations.filter((i) => i.status === "healthy").length;
  const total = integrations.length;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{"\ud83d\udd17"} Integration Status</h1>
          <p className="text-sm text-zinc-400">
            {loading ? "Checking..." : `${healthy}/${total} healthy`}
          </p>
        </div>
        <button
          onClick={() => fetchIntegrations(true)}
          disabled={refreshing}
          className="px-3 py-1.5 text-sm rounded bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 disabled:opacity-50"
        >
          {refreshing ? "Checking..." : "Refresh All"}
        </button>
      </div>

      {loading ? (
        <div className="text-zinc-400 py-12 text-center">Running health checks...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {integrations.map((integration) => (
            <IntegrationCard key={integration.id} integration={integration} />
          ))}
        </div>
      )}
    </div>
  );
}
