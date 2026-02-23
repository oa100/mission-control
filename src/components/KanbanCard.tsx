"use client";

import { useState } from "react";

interface Task {
  id: string;
  title: string;
  description?: string;
  priority?: number;
  labels?: string[];
  createdAt?: string;
}

function timeAgo(iso?: string): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (d < 1) return "today";
  if (d === 1) return "1d ago";
  return `${d}d ago`;
}

const priorityDot: Record<number, string> = {
  1: "bg-red-500",    // high
  2: "bg-blue-500",   // normal
  3: "bg-zinc-500",   // low
  4: "bg-zinc-600",   // none
};

export default function KanbanCard({ task }: { task: Task }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", task.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      onClick={() => setExpanded(!expanded)}
      className="p-3 rounded-lg bg-zinc-800 border border-zinc-700 hover:border-zinc-600 cursor-grab active:cursor-grabbing transition-colors"
    >
      <div className="flex items-start gap-2">
        {task.priority && task.priority <= 3 && (
          <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${priorityDot[task.priority] || "bg-zinc-600"}`} />
        )}
        <span className="text-sm font-medium leading-snug">{task.title}</span>
      </div>

      {task.labels && task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {task.labels.map((label) => (
            <span key={label} className="px-1.5 py-0.5 rounded text-[10px] bg-zinc-700 text-zinc-300">
              {label}
            </span>
          ))}
        </div>
      )}

      {task.createdAt && (
        <div className="text-[10px] text-zinc-500 mt-2">{timeAgo(task.createdAt)}</div>
      )}

      {expanded && task.description && (
        <div className="mt-2 pt-2 border-t border-zinc-700 text-xs text-zinc-400">
          {task.description}
        </div>
      )}
    </div>
  );
}
