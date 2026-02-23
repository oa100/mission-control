"use client";

import { useEffect, useState, useCallback } from "react";
import KanbanColumn from "@/components/KanbanColumn";

interface Task {
  id: string;
  title: string;
  description?: string;
  priority?: number;
  labels?: string[];
  createdAt?: string;
}

const columnDefs = [
  { id: "queue", title: "Backlog", color: "bg-zinc-500" },
  { id: "active", title: "In Progress", color: "bg-blue-500" },
  { id: "waiting", title: "Waiting", color: "bg-amber-500" },
  { id: "done", title: "Done", color: "bg-green-500" },
];

export default function KanbanPage() {
  const [columns, setColumns] = useState<Record<string, Task[]>>({
    queue: [], active: [], waiting: [], done: [],
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/kanban");
      const data = await res.json();
      if (data.columns) setColumns(data.columns);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  // Poll every 30s
  useEffect(() => {
    const interval = setInterval(fetchTasks, 30_000);
    return () => clearInterval(interval);
  }, [fetchTasks]);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Get all unique labels for filter
  const allLabels = Array.from(
    new Set(
      Object.values(columns)
        .flat()
        .flatMap((t) => t.labels || [])
    )
  ).sort();

  // Filter tasks
  function filterTasks(tasks: Task[]): Task[] {
    if (!filter) return tasks;
    return tasks.filter((t) => t.labels?.includes(filter));
  }

  // Optimistic drag-and-drop
  async function handleDrop(taskId: string, targetColumn: string) {
    // Find source column
    let sourceColumn = "";
    let task: Task | undefined;
    for (const [colId, tasks] of Object.entries(columns)) {
      const found = tasks.find((t) => t.id === taskId);
      if (found) {
        sourceColumn = colId;
        task = found;
        break;
      }
    }
    if (!task || sourceColumn === targetColumn) return;

    // Optimistic update
    setColumns((prev) => ({
      ...prev,
      [sourceColumn]: prev[sourceColumn].filter((t) => t.id !== taskId),
      [targetColumn]: [...prev[targetColumn], task],
    }));

    // API call
    try {
      const res = await fetch("/api/kanban", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, newState: targetColumn }),
      });
      const data = await res.json();
      if (!data.success) {
        setToast(`Failed to move task: ${data.error}`);
        fetchTasks(); // Revert by re-fetching
      }
    } catch {
      setToast("Failed to move task");
      fetchTasks();
    }
  }

  // Create new task
  async function handleAdd(title: string) {
    try {
      const res = await fetch("/api/kanban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      const data = await res.json();
      if (data.success) {
        setToast("Task created");
        fetchTasks();
      } else {
        setToast(`Failed: ${data.error}`);
      }
    } catch {
      setToast("Failed to create task");
    }
  }

  const totalTasks = Object.values(columns).flat().length;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{"\ud83d\udccb"} Kanban Board</h1>
          <p className="text-sm text-zinc-400">{totalTasks} tasks</p>
        </div>
        <button
          onClick={() => { setLoading(true); fetchTasks(); }}
          className="px-3 py-1.5 text-sm rounded bg-zinc-900 border border-zinc-700 hover:bg-zinc-800"
        >
          Refresh
        </button>
      </div>

      {/* Filter bar */}
      {allLabels.length > 0 && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-xs text-zinc-500">Filter:</span>
          <button
            onClick={() => setFilter("")}
            className={`px-2 py-1 rounded text-xs ${!filter ? "bg-blue-500 text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}`}
          >
            All
          </button>
          {allLabels.map((label) => (
            <button
              key={label}
              onClick={() => setFilter(label === filter ? "" : label)}
              className={`px-2 py-1 rounded text-xs ${filter === label ? "bg-blue-500 text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="text-zinc-400 py-12 text-center">Loading tasks...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {columnDefs.map((col) => (
            <KanbanColumn
              key={col.id}
              id={col.id}
              title={col.title}
              color={col.color}
              tasks={filterTasks(columns[col.id] || [])}
              onDrop={handleDrop}
              onAdd={col.id === "queue" ? handleAdd : undefined}
            />
          ))}
        </div>
      )}

      {toast && (
        <div
          className="fixed bottom-4 right-4 bg-zinc-900 border border-zinc-700 px-4 py-2 rounded-lg text-sm toast-in cursor-pointer"
          onClick={() => setToast(null)}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
