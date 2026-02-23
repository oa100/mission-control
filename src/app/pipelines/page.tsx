"use client";

import { useEffect, useState, useCallback } from "react";
import PipelineCard from "@/components/PipelineCard";
import StepRunner from "@/components/StepRunner";
import TerminalOutput from "@/components/TerminalOutput";

interface Step {
  id: string;
  name: string;
  command: string;
  timeout: number;
  dependsOn?: string;
  requiresArgs?: string[];
}

interface Pipeline {
  id: string;
  name: string;
  description: string;
  icon: string;
  workdir: string;
  steps: Step[];
}

type StepStatus = "idle" | "running" | "done" | "error";

export default function PipelinesPage() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [stepStatuses, setStepStatuses] = useState<Record<string, StepStatus>>({});
  const [args, setArgs] = useState<Record<string, string>>({});
  const [output, setOutput] = useState<string[]>([]);
  const [runningAll, setRunningAll] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchPipelines = useCallback(async () => {
    try {
      const res = await fetch("/api/pipelines");
      const data = await res.json();
      setPipelines(data.pipelines || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPipelines(); }, [fetchPipelines]);

  const pipeline = pipelines.find((p) => p.id === selected);

  function selectPipeline(id: string) {
    setSelected(id);
    setStepStatuses({});
    setArgs({});
    setOutput([]);
    setRunningAll(false);
  }

  function isDepMet(step: Step): boolean {
    if (!step.dependsOn) return true;
    return stepStatuses[step.dependsOn] === "done";
  }

  function isAnyRunning(): boolean {
    return Object.values(stepStatuses).includes("running");
  }

  // Collect all required args across all steps in the pipeline
  function getAllRequiredArgs(): string[] {
    if (!pipeline) return [];
    const argsSet = new Set<string>();
    for (const step of pipeline.steps) {
      if (step.requiresArgs) {
        for (const arg of step.requiresArgs) argsSet.add(arg);
      }
    }
    return Array.from(argsSet);
  }

  async function runStep(stepId: string): Promise<boolean> {
    if (!pipeline) return false;

    setStepStatuses((prev) => ({ ...prev, [stepId]: "running" }));
    setOutput((prev) => [...prev, `\u25b6 Running step: ${stepId}...`]);

    try {
      const res = await fetch("/api/pipelines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pipelineId: pipeline.id,
          stepId,
          args,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setStepStatuses((prev) => ({ ...prev, [stepId]: "done" }));
        setOutput((prev) => [...prev, data.output || "Done", ""]);
        return true;
      } else {
        setStepStatuses((prev) => ({ ...prev, [stepId]: "error" }));
        setOutput((prev) => [...prev, `\u274c Error: ${data.error}`, ""]);
        return false;
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setStepStatuses((prev) => ({ ...prev, [stepId]: "error" }));
      setOutput((prev) => [...prev, `\u274c ${msg}`, ""]);
      return false;
    }
  }

  async function runAll() {
    if (!pipeline) return;
    setRunningAll(true);
    setOutput([`\ud83d\ude80 Running all steps for ${pipeline.name}...`, ""]);

    // Build execution order respecting dependsOn
    const steps = [...pipeline.steps];
    const executed = new Set<string>();

    for (const step of steps) {
      // Skip already done steps
      if (stepStatuses[step.id] === "done") {
        executed.add(step.id);
        continue;
      }

      // Check dependency
      if (step.dependsOn && !executed.has(step.dependsOn)) {
        setOutput((prev) => [...prev, `\u26a0\ufe0f Skipping ${step.id}: dependency ${step.dependsOn} not met`]);
        continue;
      }

      const success = await runStep(step.id);
      if (success) {
        executed.add(step.id);
      } else {
        setOutput((prev) => [...prev, `\u26d4 Pipeline stopped at step: ${step.id}`]);
        break;
      }
    }

    setRunningAll(false);
    setOutput((prev) => [...prev, "\u2705 Pipeline run complete"]);
  }

  const requiredArgs = getAllRequiredArgs();

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">\ud83d\ude80 Pipeline Runner</h1>
        <p className="text-sm text-zinc-400">One-click pipeline execution</p>
      </div>

      {loading ? (
        <div className="text-zinc-400 py-12 text-center">Loading...</div>
      ) : !pipeline ? (
        /* Card Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pipelines.map((p) => (
            <PipelineCard
              key={p.id}
              pipeline={p}
              onClick={() => selectPipeline(p.id)}
              active={false}
            />
          ))}
        </div>
      ) : (
        /* Expanded Pipeline View */
        <div>
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => setSelected(null)}
              className="text-sm text-zinc-400 hover:text-white"
            >
              \u2190 Back
            </button>
            <span className="text-2xl">{pipeline.icon}</span>
            <div>
              <h2 className="text-xl font-semibold">{pipeline.name}</h2>
              <p className="text-xs text-zinc-400">{pipeline.description}</p>
            </div>
          </div>

          {/* Args inputs */}
          {requiredArgs.length > 0 && (
            <div className="mb-4 p-4 rounded-lg border border-zinc-700 bg-zinc-900">
              <h3 className="text-sm font-medium mb-3 text-zinc-300">Parameters</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {requiredArgs.map((argName) => (
                  <div key={argName}>
                    <label className="block text-xs text-zinc-400 mb-1 font-mono">{argName}</label>
                    <input
                      type="text"
                      value={args[argName] || ""}
                      onChange={(e) => setArgs((prev) => ({ ...prev, [argName]: e.target.value }))}
                      placeholder={`Enter ${argName}...`}
                      className="w-full px-3 py-2 rounded-md bg-zinc-950 border border-zinc-700 text-sm focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Run All button */}
          <div className="mb-4">
            <button
              onClick={runAll}
              disabled={runningAll || isAnyRunning()}
              className="px-4 py-2 text-sm rounded-md bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50"
            >
              {runningAll ? "Running All..." : "\u25b6 Run All Steps"}
            </button>
          </div>

          {/* Steps */}
          <div className="space-y-2">
            {pipeline.steps.map((step, i) => (
              <div key={step.id}>
                {i > 0 && step.dependsOn && (
                  <div className="flex justify-center py-1">
                    <span className="text-zinc-600 text-xs">\u2193</span>
                  </div>
                )}
                <StepRunner
                  step={step}
                  status={stepStatuses[step.id] || "idle"}
                  depsMet={isDepMet(step)}
                  onRun={runStep}
                  disabled={isAnyRunning()}
                />
              </div>
            ))}
          </div>

          {/* Terminal Output */}
          <TerminalOutput
            lines={output}
            onClear={() => setOutput([])}
          />
        </div>
      )}
    </div>
  );
}
