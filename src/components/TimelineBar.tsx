"use client";

import { useMemo } from "react";

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

interface TimelineBarProps {
  events: TimelineEvent[];
}

const categoryColors: Record<string, string> = {
  work: "#3b82f6",
  personal: "#f59e0b",
  revenue: "#10b981",
  podcast: "#8b5cf6",
  deadline: "#ef4444",
};

export default function TimelineBar({ events }: TimelineBarProps) {
  const { startDate, endDate, totalDays, todayOffset } = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 4, 0);
    const total = Math.ceil((end.getTime() - start.getTime()) / 86400000);
    const todayOff = Math.ceil((now.getTime() - start.getTime()) / 86400000);
    return { startDate: start, endDate: end, totalDays: total, todayOffset: todayOff };
  }, []);

  function getOffset(dateStr: string): number {
    const d = new Date(dateStr);
    const off = Math.ceil((d.getTime() - startDate.getTime()) / 86400000);
    return Math.max(0, Math.min(off, totalDays));
  }

  function getWidth(start: string, end?: string): number {
    if (!end) return 0;
    const s = getOffset(start);
    const e = getOffset(end);
    return Math.max(e - s, 1);
  }

  // Generate month labels
  const months = useMemo(() => {
    const result: { label: string; offset: number }[] = [];
    const d = new Date(startDate);
    while (d <= endDate) {
      const off = Math.ceil((d.getTime() - startDate.getTime()) / 86400000);
      result.push({
        label: d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
        offset: off,
      });
      d.setMonth(d.getMonth() + 1);
    }
    return result;
  }, [startDate, endDate]);

  return (
    <div className="relative border border-zinc-700 rounded-lg bg-zinc-900 overflow-x-auto">
      {/* Month labels */}
      <div className="relative h-6 border-b border-zinc-700" style={{ minWidth: `${totalDays * 6}px` }}>
        {months.map((m) => (
          <div
            key={m.label}
            className="absolute top-0 text-[10px] text-zinc-500 px-1 leading-6 border-l border-zinc-800"
            style={{ left: `${(m.offset / totalDays) * 100}%` }}
          >
            {m.label}
          </div>
        ))}
      </div>

      {/* Timeline track */}
      <div className="relative h-32" style={{ minWidth: `${totalDays * 6}px` }}>
        {/* Today marker */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-blue-500 z-10"
          style={{ left: `${(todayOffset / totalDays) * 100}%` }}
        >
          <div className="absolute -top-0 -left-2 text-[9px] text-blue-400 whitespace-nowrap">Today</div>
        </div>

        {/* Events */}
        {events.map((event, i) => {
          const offset = getOffset(event.date);
          const width = event.endDate ? getWidth(event.date, event.endDate) : 0;
          const color = event.color || categoryColors[event.category] || "#3b82f6";
          const top = 16 + (i % 5) * 22;

          return (
            <div
              key={event.id}
              className="absolute group"
              style={{
                left: `${(offset / totalDays) * 100}%`,
                top: `${top}px`,
                ...(width > 0 ? { width: `${(width / totalDays) * 100}%` } : {}),
              }}
            >
              {width > 0 ? (
                /* Multi-day bar */
                <div
                  className="h-5 rounded-full flex items-center px-2 text-[10px] font-medium text-white truncate"
                  style={{ backgroundColor: color, minWidth: "20px" }}
                >
                  {event.icon} {event.title}
                </div>
              ) : (
                /* Single-day dot */
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full shrink-0 border-2 border-zinc-950" style={{ backgroundColor: color }} />
                  <span className="text-[10px] text-zinc-400 whitespace-nowrap hidden group-hover:inline">
                    {event.icon} {event.title}
                  </span>
                </div>
              )}

              {/* Tooltip */}
              <div className="absolute bottom-full left-0 mb-1 hidden group-hover:block z-20">
                <div className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-[10px] text-zinc-200 whitespace-nowrap shadow-lg">
                  {event.icon} {event.title} — {event.date}
                  {event.endDate && ` to ${event.endDate}`}
                  <span className="text-zinc-500 ml-1">({event.source})</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
