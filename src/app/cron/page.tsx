"use client";
import { useEffect, useState, useCallback } from "react";

interface CronJob {
  id?: string;
  jobId?: string;
  name?: string;
  schedule?: { kind?: string; expr?: string; everyMs?: number };
  payload?: { kind?: string; text?: string; message?: string };
  enabled?: boolean;
  lastRun?: { status?: string; at?: string; error?: string };
}

function StatusBadge({ job }: { job: CronJob }) {
  if (!job.enabled) return <span className="px-2 py-0.5 rounded text-xs bg-yellow-900/50 text-yellow-400">Disabled</span>;
  const status = job.lastRun?.status;
  if (status === "ok" || status === "success")
    return <span className="px-2 py-0.5 rounded text-xs bg-green-900/50 text-green-400">OK</span>;
  if (status === "error" || status === "failed")
    return <span className="px-2 py-0.5 rounded text-xs bg-red-900/50 text-red-400">Failed</span>;
  return <span className="px-2 py-0.5 rounded text-xs bg-zinc-700 text-zinc-400">—</span>;
}

function scheduleLabel(s?: CronJob["schedule"]): string {
  if (!s) return "—";
  if (s.kind === "cron") return s.expr || "cron";
  if (s.kind === "every") return `every ${Math.round((s.everyMs || 0) / 60000)}m`;
  return s.kind || "—";
}

function timeAgo(iso?: string): string {
  if (!iso) return "never";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function CronPage() {
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch("/api/cron");
      const data = await res.json();
      setJobs(data.jobs || []);
    } catch {
      setToast("Failed to fetch cron jobs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  async function triggerJob(jobId: string) {
    setRunning(jobId);
    try {
      const res = await fetch("/api/cron", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, action: "run" }),
      });
      const data = await res.json();
      setToast(data.success ? `Triggered ${jobId}` : `Error: ${data.error}`);
      setTimeout(fetchJobs, 2000);
    } catch {
      setToast("Failed to trigger job");
    } finally {
      setRunning(null);
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">⏰ Cron Command Center</h1>
          <p className="text-sm text-[var(--muted)]">{jobs.length} jobs</p>
        </div>
        <button onClick={() => { setLoading(true); fetchJobs(); }} className="px-3 py-1.5 text-sm rounded bg-[var(--card)] border border-[var(--border)] hover:bg-[var(--card-hover)]">
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-[var(--muted)] py-12 text-center">Loading...</div>
      ) : jobs.length === 0 ? (
        <div className="text-[var(--muted)] py-12 text-center">No cron jobs found.</div>
      ) : (
        <div className="border border-[var(--border)] rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--card)] text-left text-[var(--muted)]">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Schedule</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Last Run</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => {
                const id = job.jobId || job.id || "unknown";
                return (
                  <tr key={id} className="border-t border-[var(--border)] hover:bg-[var(--card-hover)]">
                    <td className="px-4 py-3">
                      <div className="font-medium">{job.name || id}</div>
                      <div className="text-xs text-[var(--muted)] font-mono">{id}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{scheduleLabel(job.schedule)}</td>
                    <td className="px-4 py-3"><StatusBadge job={job} /></td>
                    <td className="px-4 py-3 text-[var(--muted)]">{timeAgo(job.lastRun?.at)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => triggerJob(id)}
                        disabled={running === id}
                        className="px-3 py-1 text-xs rounded bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white disabled:opacity-50"
                      >
                        {running === id ? "..." : "▶ Run"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-4 right-4 bg-[var(--card)] border border-[var(--border)] px-4 py-2 rounded-lg text-sm toast-in cursor-pointer" onClick={() => setToast(null)}>
          {toast}
        </div>
      )}
    </div>
  );
}
