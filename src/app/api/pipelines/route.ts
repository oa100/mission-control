import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

interface PipelineStep {
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
  steps: PipelineStep[];
}

async function loadPipelines(): Promise<Pipeline[]> {
  const filePath = path.join(process.cwd(), "pipelines.json");
  const raw = await readFile(filePath, "utf-8");
  return JSON.parse(raw);
}

export async function GET() {
  try {
    const pipelines = await loadPipelines();
    return NextResponse.json({ pipelines });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ pipelines: [], error: msg });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { pipelineId, stepId, args } = await request.json();

    const pipelines = await loadPipelines();
    const pipeline = pipelines.find((p) => p.id === pipelineId);
    if (!pipeline) {
      return NextResponse.json({ success: false, error: `Pipeline "${pipelineId}" not found` }, { status: 404 });
    }

    const step = pipeline.steps.find((s) => s.id === stepId);
    if (!step) {
      return NextResponse.json({ success: false, error: `Step "${stepId}" not found in pipeline "${pipelineId}"` }, { status: 404 });
    }

    // Substitute ${VAR} placeholders from args
    let command = step.command;
    if (args && typeof args === "object") {
      for (const [key, value] of Object.entries(args)) {
        command = command.replace(new RegExp(`\\$\\{${key}\\}`, "g"), String(value));
      }
    }

    // Check for unresolved variables
    const unresolved = command.match(/\$\{(\w+)\}/g);
    if (unresolved) {
      const missing = unresolved.map((v) => v.slice(2, -1));
      return NextResponse.json({ success: false, error: `Missing required args: ${missing.join(", ")}` }, { status: 400 });
    }

    const { stdout, stderr } = await execAsync(command, {
      timeout: step.timeout || 30000,
      cwd: pipeline.workdir,
    });

    return NextResponse.json({
      success: true,
      output: stdout || stderr || "Done",
      exitCode: 0,
    });
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e) {
      const execErr = e as { code: number; stdout?: string; stderr?: string; message?: string };
      return NextResponse.json({
        success: false,
        error: execErr.stderr || execErr.message || String(e),
        output: execErr.stdout || "",
        exitCode: execErr.code,
      });
    }
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ success: false, error: msg, exitCode: 1 });
  }
}
