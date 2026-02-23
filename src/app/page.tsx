"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface SummaryData {
  revenueYTD: number;
  goalProgress: number;
  goalLabel: string;
  tasksInProgress: number;
  nextDeadline: { title: string; daysUntil: number } | null;
  integrationsHealthy: number;
  integrationsTotal: number;
  kanbanCounts: Record<string, number>;
  upcomingEvents: { title: string; date: string; icon?: string }[];
}

const modules = [
  { href: "/cron", icon: "\u23f0", title: "Cron Center", description: "Scheduled jobs" },
  { href: "/memory", icon: "\ud83e\udde0", title: "Memory Browser", description: "Memory files" },
  { href: "/actions", icon: "\u26a1", title: "Quick Actions", description: "One-click commands" },
  { href: "/pipelines", icon: "\ud83d\ude80", title: "Pipelines", description: "Pipeline execution" },
  { href: "/kanban", icon: "\ud83d\udccb", title: "Kanban Board", description: "Task management" },
  { href: "/revenue", icon: "\ud83d\udcb0", title: "Revenue", description: "Revenue tracking" },
  { href: "/timeline", icon: "\ud83d\udcc5", title: "Timeline", description: "Events & deadlines" },
  { href: "/integrations", icon: "\ud83d\udd17", title: "Integrations", description: "Service health" },
];

export default function Home() {
  const [summary, setSummary] = useState<SummaryData | null>(null);

  useEffect(() => {
    async function loadSummary() {
      const results: Partial<SummaryData> = {
        revenueYTD: 0,
        goalProgress: 0,
        goalLabel: "",
        tasksInProgress: 0,
        nextDeadline: null,
        integrationsHealthy: 0,
        integrationsTotal: 0,
        kanbanCounts: {},
        upcomingEvents: [],
      };

      // Fetch all in parallel, each with error handling
      const [revRes, kanbanRes, timelineRes, intRes] = await Promise.allSettled([
        fetch("/api/revenue").then((r) => r.json()),
        fetch("/api/kanban").then((r) => r.json()),
        fetch("/api/timeline").then((r) => r.json()),
        fetch("/api/integrations").then((r) => r.json()),
      ]);

      if (revRes.status === "fulfilled") {
        const rev = revRes.value;
        results.revenueYTD = rev.totalYTD || 0;
        if (rev.goals?.[0]) {
          results.goalProgress = rev.goals[0].progress || 0;
          results.goalLabel = rev.goals[0].label || "";
        }
      }

      if (kanbanRes.status === "fulfilled" && kanbanRes.value.columns) {
        const cols = kanbanRes.value.columns;
        results.kanbanCounts = {
          queue: cols.queue?.length || 0,
          active: cols.active?.length || 0,
          waiting: cols.waiting?.length || 0,
          done: cols.done?.length || 0,
        };
        results.tasksInProgress = cols.active?.length || 0;
      }

      if (timelineRes.status === "fulfilled") {
        const events = timelineRes.value.events || [];
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const upcoming = events
          .filter((e: { date: string }) => new Date(e.date) >= now)
          .slice(0, 5);
        results.upcomingEvents = upcoming;
        if (upcoming.length > 0) {
          const days = Math.ceil((new Date(upcoming[0].date).getTime() - now.getTime()) / 86400000);
          results.nextDeadline = { title: upcoming[0].title, daysUntil: days };
        }
      }

      if (intRes.status === "fulfilled") {
        const ints = intRes.value.integrations || [];
        results.integrationsTotal = ints.length;
        results.integrationsHealthy = ints.filter((i: { status: string }) => i.status === "healthy").length;
      }

      setSummary(results as SummaryData);
    }

    loadSummary();
  }, []);

  return (
    <div className="max-w-6xl">
      <h1 className="text-4xl font-bold text-white mb-2">Mission Control {"\ud83d\udc3e"}</h1>
      <p className="text-zinc-400 text-lg mb-6">
        Clawdy&apos;s Dashboard
      </p>

      {/* Summary stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="p-4 rounded-lg border border-zinc-700 bg-zinc-900">
          <div className="text-xs text-zinc-400 mb-1">Revenue YTD</div>
          <div className="text-2xl font-bold">
            {summary ? `$${summary.revenueYTD.toLocaleString()}` : "..."}
          </div>
          {summary?.goalLabel && (
            <div className="text-[10px] text-zinc-500 mt-1">{summary.goalProgress}% of goal</div>
          )}
        </div>
        <div className="p-4 rounded-lg border border-zinc-700 bg-zinc-900">
          <div className="text-xs text-zinc-400 mb-1">Tasks In Progress</div>
          <div className="text-2xl font-bold text-blue-400">
            {summary?.tasksInProgress ?? "..."}
          </div>
        </div>
        <div className="p-4 rounded-lg border border-zinc-700 bg-zinc-900">
          <div className="text-xs text-zinc-400 mb-1">Next Deadline</div>
          <div className="text-lg font-bold truncate">
            {summary?.nextDeadline
              ? `${summary.nextDeadline.daysUntil}d`
              : "..."}
          </div>
          {summary?.nextDeadline && (
            <div className="text-[10px] text-zinc-500 truncate">{summary.nextDeadline.title}</div>
          )}
        </div>
        <div className="p-4 rounded-lg border border-zinc-700 bg-zinc-900">
          <div className="text-xs text-zinc-400 mb-1">Integrations</div>
          <div className="text-2xl font-bold">
            {summary ? (
              <span className={summary.integrationsHealthy === summary.integrationsTotal ? "text-green-400" : "text-amber-400"}>
                {summary.integrationsHealthy}/{summary.integrationsTotal}
              </span>
            ) : "..."}
          </div>
          <div className="text-[10px] text-zinc-500">healthy</div>
        </div>
      </div>

      {/* Middle row: mini kanban + mini timeline */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Mini kanban */}
        <Link href="/kanban" className="block p-4 rounded-lg border border-zinc-700 bg-zinc-900 hover:border-blue-500 hover:bg-zinc-800 transition-colors">
          <h3 className="text-sm font-semibold mb-3">{"\ud83d\udccb"} Kanban</h3>
          {summary?.kanbanCounts ? (
            <div className="flex gap-3">
              {[
                { key: "queue", label: "Backlog", color: "bg-zinc-500" },
                { key: "active", label: "Active", color: "bg-blue-500" },
                { key: "waiting", label: "Waiting", color: "bg-amber-500" },
                { key: "done", label: "Done", color: "bg-green-500" },
              ].map((col) => (
                <div key={col.key} className="flex-1 text-center">
                  <div className="text-xl font-bold">{summary.kanbanCounts[col.key] || 0}</div>
                  <div className="flex items-center justify-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${col.color}`} />
                    <span className="text-[10px] text-zinc-500">{col.label}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-zinc-500 text-sm">Loading...</div>
          )}
        </Link>

        {/* Mini timeline */}
        <Link href="/timeline" className="block p-4 rounded-lg border border-zinc-700 bg-zinc-900 hover:border-blue-500 hover:bg-zinc-800 transition-colors">
          <h3 className="text-sm font-semibold mb-3">{"\ud83d\udcc5"} Upcoming</h3>
          {summary?.upcomingEvents && summary.upcomingEvents.length > 0 ? (
            <div className="space-y-2">
              {summary.upcomingEvents.map((event, i) => {
                const days = Math.ceil(
                  (new Date(event.date).getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000
                );
                return (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="truncate">
                      {event.icon || "\ud83d\udccc"} {event.title}
                    </span>
                    <span className={`text-xs font-mono shrink-0 ml-2 ${
                      days <= 3 ? "text-red-400" : days <= 7 ? "text-amber-400" : "text-zinc-400"
                    }`}>
                      {days === 0 ? "Today" : `${days}d`}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-zinc-500 text-sm">No upcoming events</div>
          )}
        </Link>
      </div>

      {/* Module cards grid */}
      <h3 className="text-sm font-semibold text-zinc-400 mb-3">All Modules</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {modules.map((mod) => (
          <Link
            key={mod.href}
            href={mod.href}
            className="block bg-zinc-900 border border-zinc-700 rounded-lg p-4 transition-colors hover:border-blue-500 hover:bg-zinc-800"
          >
            <div className="text-2xl mb-2">{mod.icon}</div>
            <h2 className="text-sm font-semibold text-white">{mod.title}</h2>
            <p className="text-zinc-500 text-xs">{mod.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
