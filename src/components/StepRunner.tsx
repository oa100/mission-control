"use client";

interface Step {
  id: string;
  name: string;
  command: string;
  timeout: number;
  dependsOn?: string;
  requiresArgs?: string[];
}

type StepStatus = "idle" | "running" | "done" | "error";

interface StepRunnerProps {
  step: Step;
  status: StepStatus;
  depsMet: boolean;
  onRun: (stepId: string) => void;
  disabled: boolean;
}

const statusConfig: Record<StepStatus, { dot: string; label: string; color: string }> = {
  idle: { dot: "bg-zinc-600", label: "Idle", color: "text-zinc-400" },
  running: { dot: "bg-blue-500 animate-pulse", label: "Running", color: "text-blue-400" },
  done: { dot: "bg-green-500", label: "Done", color: "text-green-400" },
  error: { dot: "bg-red-500", label: "Error", color: "text-red-400" },
};

export default function StepRunner({ step, status, depsMet, onRun, disabled }: StepRunnerProps) {
  const cfg = statusConfig[status];
  const canRun = depsMet && status !== "running" && !disabled;

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border ${
      status === "running" ? "border-blue-500/50 bg-blue-950/20" :
      status === "done" ? "border-green-500/30 bg-green-950/10" :
      status === "error" ? "border-red-500/30 bg-red-950/10" :
      "border-zinc-700 bg-zinc-900"
    }`}>
      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${cfg.dot}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{step.name}</span>
          <span className={`text-xs ${cfg.color}`}>{cfg.label}</span>
        </div>
        <div className="text-xs text-zinc-500 font-mono truncate">{step.command}</div>
        {step.dependsOn && !depsMet && (
          <div className="text-xs text-yellow-500 mt-1">Waiting on: {step.dependsOn}</div>
        )}
      </div>
      <button
        onClick={() => onRun(step.id)}
        disabled={!canRun}
        className="px-3 py-1 text-xs rounded bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
      >
        {status === "running" ? "..." : "\u25b6 Run"}
      </button>
    </div>
  );
}
