"use client";

import { useEffect, useState, useCallback } from "react";
import RevenueChart from "@/components/RevenueChart";

interface Business {
  id: string;
  name: string;
  icon: string;
  color: string;
  entries: { date: string; amount: number; description: string; category?: string }[];
}

interface Goal {
  label: string;
  target: number;
  deadline: string;
  current: number;
  progress: number;
}

interface RevenueData {
  businesses: Business[];
  totalYTD: number;
  thisMonthTotal: number;
  lastMonthTotal: number;
  trend: "up" | "down";
  businessTotals: Record<string, number>;
  monthlyBreakdown: Record<string, Record<string, number>>;
  goals: Goal[];
}

export default function RevenuePage() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ businessId: "", amount: "", date: "", description: "", category: "" });
  const [toast, setToast] = useState<string | null>(null);

  const fetchRevenue = useCallback(async () => {
    try {
      const res = await fetch("/api/revenue");
      const d = await res.json();
      setData(d);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRevenue(); }, [fetchRevenue]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  async function addEntry() {
    if (!form.businessId || !form.amount || !form.date) return;
    try {
      const res = await fetch("/api/revenue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, amount: Number(form.amount) }),
      });
      const result = await res.json();
      if (result.success) {
        setToast("Entry added");
        setAdding(false);
        setForm({ businessId: "", amount: "", date: "", description: "", category: "" });
        fetchRevenue();
      } else {
        setToast(`Error: ${result.error}`);
      }
    } catch {
      setToast("Failed to add entry");
    }
  }

  if (loading) return <div className="text-zinc-400 py-12 text-center">Loading revenue data...</div>;
  if (!data) return <div className="text-zinc-400 py-12 text-center">Failed to load revenue data</div>;

  // Monthly breakdown table data
  const months: string[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{"\ud83d\udcb0"} Revenue Tracker</h1>
          <p className="text-sm text-zinc-400">YTD performance</p>
        </div>
        <button
          onClick={() => setAdding(!adding)}
          className="px-3 py-1.5 text-sm rounded bg-blue-500 hover:bg-blue-600 text-white"
        >
          + Add Entry
        </button>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-lg border border-zinc-700 bg-zinc-900">
          <div className="text-xs text-zinc-400 mb-1">Total YTD</div>
          <div className="text-3xl font-bold">${data.totalYTD.toLocaleString()}</div>
          <div className={`text-xs mt-1 ${data.trend === "up" ? "text-green-400" : "text-red-400"}`}>
            {data.trend === "up" ? "\u2191" : "\u2193"} vs last month
          </div>
        </div>

        {data.goals.map((goal, i) => (
          <div key={i} className="p-4 rounded-lg border border-zinc-700 bg-zinc-900 col-span-1 md:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-zinc-400">{goal.label}</span>
              <span className="text-sm font-mono">${goal.current.toLocaleString()} / ${goal.target.toLocaleString()}</span>
            </div>
            <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${goal.progress}%`,
                  backgroundColor: goal.progress >= 100 ? "#22c55e" : "#3b82f6",
                }}
              />
            </div>
            <div className="text-right text-xs text-zinc-500 mt-1">{goal.progress}%</div>
          </div>
        ))}
      </div>

      {/* Add entry form */}
      {adding && (
        <div className="mb-6 p-4 rounded-lg border border-zinc-700 bg-zinc-900">
          <h3 className="text-sm font-medium mb-3">New Revenue Entry</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <select
              value={form.businessId}
              onChange={(e) => setForm((f) => ({ ...f, businessId: e.target.value }))}
              className="px-3 py-2 rounded bg-zinc-950 border border-zinc-700 text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="">Select business...</option>
              {data.businesses.map((b) => (
                <option key={b.id} value={b.id}>{b.icon} {b.name}</option>
              ))}
            </select>
            <input
              type="number" placeholder="Amount" value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              className="px-3 py-2 rounded bg-zinc-950 border border-zinc-700 text-sm focus:outline-none focus:border-blue-500"
            />
            <input
              type="date" value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              className="px-3 py-2 rounded bg-zinc-950 border border-zinc-700 text-sm focus:outline-none focus:border-blue-500"
            />
            <input
              type="text" placeholder="Description" value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="px-3 py-2 rounded bg-zinc-950 border border-zinc-700 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={addEntry} className="px-3 py-1.5 text-sm rounded bg-blue-500 hover:bg-blue-600 text-white">Save</button>
            <button onClick={() => setAdding(false)} className="px-3 py-1.5 text-sm rounded bg-zinc-800 text-zinc-400">Cancel</button>
          </div>
        </div>
      )}

      {/* Business cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {data.businesses.map((biz) => (
          <div key={biz.id} className="p-4 rounded-lg border border-zinc-700 bg-zinc-900">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{biz.icon}</span>
              <span className="font-semibold">{biz.name}</span>
            </div>
            <div className="text-2xl font-bold mb-2" style={{ color: biz.color }}>
              ${(data.businessTotals[biz.id] || 0).toLocaleString()}
            </div>
            <RevenueChart
              monthlyBreakdown={data.monthlyBreakdown}
              businessId={biz.id}
              color={biz.color}
            />
            {biz.entries.length > 0 && (
              <div className="text-[10px] text-zinc-500 mt-2">
                Last entry: {biz.entries[biz.entries.length - 1].date}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Monthly breakdown table */}
      <div className="border border-zinc-700 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-zinc-900 text-zinc-400">
              <th className="px-3 py-2 text-left font-medium">Month</th>
              {data.businesses.map((b) => (
                <th key={b.id} className="px-3 py-2 text-right font-medium">{b.icon}</th>
              ))}
              <th className="px-3 py-2 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {months.map((month, mi) => {
              const monthData = data.monthlyBreakdown[month] || {};
              const monthTotal = Object.values(monthData).reduce((a, b) => a + b, 0);
              const isCurrent = mi === now.getMonth();
              return (
                <tr key={month} className={`border-t border-zinc-700 ${isCurrent ? "bg-zinc-800/50" : ""}`}>
                  <td className="px-3 py-2 font-medium">{monthLabels[mi]}{isCurrent ? " *" : ""}</td>
                  {data.businesses.map((b) => (
                    <td key={b.id} className="px-3 py-2 text-right font-mono text-xs">
                      {monthData[b.id] ? `$${monthData[b.id].toLocaleString()}` : "\u2014"}
                    </td>
                  ))}
                  <td className="px-3 py-2 text-right font-mono text-xs font-semibold">
                    {monthTotal > 0 ? `$${monthTotal.toLocaleString()}` : "\u2014"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {toast && (
        <div className="fixed bottom-4 right-4 bg-zinc-900 border border-zinc-700 px-4 py-2 rounded-lg text-sm toast-in cursor-pointer" onClick={() => setToast(null)}>
          {toast}
        </div>
      )}
    </div>
  );
}
