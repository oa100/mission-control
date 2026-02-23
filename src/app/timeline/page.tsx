"use client";

import { useEffect, useState, useCallback } from "react";
import TimelineBar from "@/components/TimelineBar";

interface TimelineEvent {
  id: string;
  title: string;
  date: string;
  endDate?: string;
  icon?: string;
  color?: string;
  category: string;
  source: string;
}

function daysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  return Math.ceil((target.getTime() - now.getTime()) / 86400000);
}

const sourceBadge: Record<string, string> = {
  manual: "bg-amber-900/30 text-amber-400",
  github: "bg-blue-900/30 text-blue-400",
  cron: "bg-purple-900/30 text-purple-400",
  revenue: "bg-green-900/30 text-green-400",
};

export default function TimelinePage() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: "", date: "", endDate: "", icon: "", category: "personal" });
  const [toast, setToast] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch("/api/timeline");
      const data = await res.json();
      setEvents(data.events || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  async function addMilestone() {
    if (!form.title || !form.date) return;
    try {
      const res = await fetch("/api/timeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setToast("Milestone added");
        setAdding(false);
        setForm({ title: "", date: "", endDate: "", icon: "", category: "personal" });
        fetchEvents();
      } else {
        setToast(`Error: ${data.error}`);
      }
    } catch {
      setToast("Failed to add milestone");
    }
  }

  // Upcoming events (next 10 future events)
  const upcoming = events
    .filter((e) => daysUntil(e.date) >= 0)
    .slice(0, 10);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{"\ud83d\udcc5"} Timeline</h1>
          <p className="text-sm text-zinc-400">{events.length} events</p>
        </div>
        <button
          onClick={() => setAdding(!adding)}
          className="px-3 py-1.5 text-sm rounded bg-blue-500 hover:bg-blue-600 text-white"
        >
          + Add Milestone
        </button>
      </div>

      {/* Add milestone form */}
      {adding && (
        <div className="mb-6 p-4 rounded-lg border border-zinc-700 bg-zinc-900">
          <h3 className="text-sm font-medium mb-3">New Milestone</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text" placeholder="Title" value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="px-3 py-2 rounded bg-zinc-950 border border-zinc-700 text-sm focus:outline-none focus:border-blue-500"
            />
            <input
              type="date" value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              className="px-3 py-2 rounded bg-zinc-950 border border-zinc-700 text-sm focus:outline-none focus:border-blue-500"
            />
            <input
              type="date" placeholder="End date (optional)" value={form.endDate}
              onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
              className="px-3 py-2 rounded bg-zinc-950 border border-zinc-700 text-sm focus:outline-none focus:border-blue-500"
            />
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="px-3 py-2 rounded bg-zinc-950 border border-zinc-700 text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="personal">Personal</option>
              <option value="work">Work</option>
              <option value="podcast">Podcast</option>
              <option value="deadline">Deadline</option>
            </select>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={addMilestone} className="px-3 py-1.5 text-sm rounded bg-blue-500 hover:bg-blue-600 text-white">Save</button>
            <button onClick={() => setAdding(false)} className="px-3 py-1.5 text-sm rounded bg-zinc-800 text-zinc-400">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-zinc-400 py-12 text-center">Loading timeline...</div>
      ) : (
        <>
          {/* Horizontal timeline */}
          <div className="mb-8">
            <TimelineBar events={events} />
          </div>

          {/* Upcoming events */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Upcoming</h2>
            {upcoming.length === 0 ? (
              <div className="text-zinc-500 text-sm">No upcoming events</div>
            ) : (
              <div className="space-y-2">
                {upcoming.map((event) => {
                  const days = daysUntil(event.date);
                  return (
                    <div
                      key={event.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-zinc-700 bg-zinc-900"
                    >
                      <span className="text-xl">{event.icon || "\ud83d\udccc"}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">{event.title}</div>
                        <div className="text-xs text-zinc-400">{event.date}{event.endDate ? ` \u2014 ${event.endDate}` : ""}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] ${sourceBadge[event.source] || "bg-zinc-700 text-zinc-400"}`}>
                        {event.source}
                      </span>
                      <span className={`text-sm font-mono ${days <= 3 ? "text-red-400" : days <= 7 ? "text-amber-400" : "text-zinc-400"}`}>
                        {days === 0 ? "Today" : days === 1 ? "Tomorrow" : `${days}d`}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {toast && (
        <div className="fixed bottom-4 right-4 bg-zinc-900 border border-zinc-700 px-4 py-2 rounded-lg text-sm toast-in cursor-pointer" onClick={() => setToast(null)}>
          {toast}
        </div>
      )}
    </div>
  );
}
