"use client";

import { useState, useEffect } from "react";

interface Action {
  id: string;
  title: string;
  description: string;
  icon: string;
  command: string;
}

export default function ActionsPage() {
  const [actions, setActions] = useState<Action[]>([]);
  const [running, setRunning] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    fetchActions();
  }, []);

  const fetchActions = async () => {
    try {
      const res = await fetch("/api/actions/list");
      const data = await res.json();
      setActions(data.actions || []);
    } catch (error) {
      console.error("Failed to fetch actions:", error);
    }
  };

  const runAction = async (action: Action) => {
    setRunning(action.id);
    try {
      const res = await fetch("/api/actions/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionId: action.id }),
      });
      const data = await res.json();

      if (data.success) {
        showToast(`${action.title} completed successfully!`, "success");
      } else {
        showToast(`${action.title} failed: ${data.error}`, "error");
      }
    } catch (error) {
      showToast(`Failed to run ${action.title}`, "error");
    } finally {
      setRunning(null);
    }
  };

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  return (
    <div className="max-w-7xl">
      <h1 className="text-4xl font-bold text-white mb-8">Quick Actions</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {actions.map((action) => (
          <div
            key={action.id}
            className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 hover:border-blue-600 transition-colors"
          >
            <div className="text-4xl mb-4">{action.icon}</div>
            <h2 className="text-xl font-semibold text-white mb-2">{action.title}</h2>
            <p className="text-zinc-400 text-sm mb-4 min-h-[40px]">{action.description}</p>
            <button
              onClick={() => runAction(action)}
              disabled={running === action.id}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
            >
              {running === action.id ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Running...
                </span>
              ) : (
                "Run"
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-8 right-8 px-6 py-4 rounded-lg shadow-lg ${
            toast.type === "success"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          } animate-slide-up`}
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">{toast.type === "success" ? "✓" : "✗"}</span>
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
