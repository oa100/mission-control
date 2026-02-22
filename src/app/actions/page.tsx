"use client";
import { useEffect, useState, useCallback } from "react";

interface Action { id: string; icon: string; title: string; desc: string; command: string }

export default function ActionsPage() {
  const [actions, setActions] = useState<Action[]>([]);
  const [running, setRunning] = useState<string | null>(null);
  const [outputs, setOutputs] = useState<Record<string, { ok: boolean; text: string }>>({});

  const fetchActions = useCallback(async () => {
    const res = await fetch("/api/actions");
    const data = await res.json();
    setActions(data.actions || []);
  }, []);

  useEffect(() => { fetchActions(); }, [fetchActions]);

  async function runAction(action: Action) {
    setRunning(action.id);
    setOutputs((prev) => ({ ...prev, [action.id]: { ok: true, text: "Running..." } }));
    try {
      const res = await fetch("/api/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: action.id, command: action.command }),
      });
      const data = await res.json();
      setOutputs((prev) => ({
        ...prev,
        [action.id]: { ok: data.success, text: data.output || data.error || "Done" },
      }));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setOutputs((prev) => ({ ...prev, [action.id]: { ok: false, text: msg } }));
    } finally {
      setRunning(null);
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">⚡ Quick Actions</h1>
        <p className="text-sm text-[var(--muted)]">One-click workflows and diagnostics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {actions.map((action) => (
          <div key={action.id} className="p-4 rounded-lg border border-[var(--border)] bg-[var(--card)]">
            <div className="text-2xl mb-2">{action.icon}</div>
            <h3 className="font-semibold mb-1">{action.title}</h3>
            <p className="text-xs text-[var(--muted)] mb-3">{action.desc}</p>
            <button
              onClick={() => runAction(action)}
              disabled={running === action.id}
              className="w-full px-3 py-1.5 text-sm rounded bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white disabled:opacity-50"
            >
              {running === action.id ? "Running..." : "▶ Run"}
            </button>
            {outputs[action.id] && (
              <div className={`text-xs font-mono p-2 rounded mt-2 ${
                outputs[action.id].ok ? "bg-green-900/20 text-green-400" : "bg-red-900/20 text-red-400"
              }`}>
                <pre className="whitespace-pre-wrap">{outputs[action.id].text}</pre>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
