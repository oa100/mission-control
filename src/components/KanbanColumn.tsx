"use client";

import { useState } from "react";
import KanbanCard from "./KanbanCard";

interface Task {
  id: string;
  title: string;
  description?: string;
  priority?: number;
  labels?: string[];
  createdAt?: string;
}

interface KanbanColumnProps {
  id: string;
  title: string;
  color: string;
  tasks: Task[];
  onDrop: (taskId: string, columnId: string) => void;
  onAdd?: (title: string) => void;
}

export default function KanbanColumn({ id, title, color, tasks, onDrop, onAdd }: KanbanColumnProps) {
  const [dragOver, setDragOver] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const taskId = e.dataTransfer.getData("text/plain");
    if (taskId) onDrop(taskId, id);
  }

  function handleAdd() {
    if (!newTitle.trim()) return;
    onAdd?.(newTitle.trim());
    setNewTitle("");
    setAdding(false);
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={`flex flex-col rounded-lg border ${
        dragOver ? "border-blue-500 bg-blue-950/10" : "border-zinc-700 bg-zinc-900/50"
      } transition-colors`}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-700">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
          <span className="text-sm font-semibold">{title}</span>
          <span className="text-xs text-zinc-500">{tasks.length}</span>
        </div>
        {onAdd && (
          <button
            onClick={() => setAdding(!adding)}
            className="text-zinc-500 hover:text-white text-lg leading-none"
          >
            +
          </button>
        )}
      </div>

      {/* Add task form */}
      {adding && (
        <div className="p-2 border-b border-zinc-700">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Task title..."
            className="w-full px-2 py-1.5 rounded bg-zinc-800 border border-zinc-700 text-sm focus:outline-none focus:border-blue-500"
            autoFocus
          />
          <div className="flex gap-1 mt-1">
            <button onClick={handleAdd} className="px-2 py-1 text-xs rounded bg-blue-500 text-white">Add</button>
            <button onClick={() => setAdding(false)} className="px-2 py-1 text-xs rounded bg-zinc-800 text-zinc-400">Cancel</button>
          </div>
        </div>
      )}

      {/* Cards */}
      <div className="flex-1 p-2 space-y-2 min-h-[200px] overflow-y-auto max-h-[65vh]">
        {tasks.map((task) => (
          <KanbanCard key={task.id} task={task} />
        ))}
        {tasks.length === 0 && (
          <div className="text-xs text-zinc-600 text-center py-8">No tasks</div>
        )}
      </div>
    </div>
  );
}
