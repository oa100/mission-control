import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

interface Integration {
  id: string;
  name: string;
  icon: string;
  status: "healthy" | "degraded" | "down" | "unknown";
  message: string;
  checkedAt: string;
}

interface CheckDef {
  id: string;
  name: string;
  icon: string;
  command: string;
  parseOutput?: (stdout: string, stderr: string) => { status: Integration["status"]; message: string };
}

const checks: CheckDef[] = [
  {
    id: "telegram",
    name: "Telegram",
    icon: "\u2709\ufe0f",
    command: "openclaw status 2>&1",
    parseOutput: (stdout) => {
      const lower = stdout.toLowerCase();
      if (lower.includes("telegram") && (lower.includes("connected") || lower.includes("ok")))
        return { status: "healthy", message: "Connected" };
      if (lower.includes("telegram"))
        return { status: "down", message: "Disconnected" };
      return { status: "unknown", message: "Could not determine status" };
    },
  },
  {
    id: "slack",
    name: "Slack",
    icon: "\ud83d\udcac",
    command: "openclaw status 2>&1",
    parseOutput: (stdout) => {
      const lower = stdout.toLowerCase();
      if (lower.includes("slack") && (lower.includes("connected") || lower.includes("ok")))
        return { status: "healthy", message: "Connected" };
      if (lower.includes("slack"))
        return { status: "down", message: "Disconnected" };
      return { status: "unknown", message: "Could not determine status" };
    },
  },
  {
    id: "github",
    name: "GitHub",
    icon: "\ud83d\udc19",
    command: "gh auth status 2>&1",
    parseOutput: (stdout) => {
      if (stdout.includes("Logged in"))
        return { status: "healthy", message: "Authenticated" };
      return { status: "down", message: "Not authenticated" };
    },
  },
  {
    id: "todoist",
    name: "Todoist",
    icon: "\u2705",
    command: "python3 ~/.openclaw/workspace/skills/todoist-tracker/todoist.py reconcile 2>&1 | head -5",
    parseOutput: (stdout, stderr) => {
      const combined = stdout + stderr;
      if (combined.toLowerCase().includes("error") || combined.toLowerCase().includes("traceback"))
        return { status: "down", message: combined.slice(0, 100) };
      return { status: "healthy", message: "Reachable" };
    },
  },
  {
    id: "auphonic",
    name: "Auphonic",
    icon: "\ud83c\udfa7",
    command: "curl -sf --max-time 5 https://auphonic.com/api/info.json > /dev/null && echo OK || echo FAIL",
    parseOutput: (stdout) => {
      if (stdout.trim() === "OK") return { status: "healthy", message: "API reachable" };
      return { status: "down", message: "API unreachable" };
    },
  },
  {
    id: "syncthing",
    name: "Syncthing",
    icon: "\ud83d\udd04",
    command: "curl -sf --max-time 5 http://localhost:8384/rest/system/status > /dev/null && echo OK || echo FAIL",
    parseOutput: (stdout) => {
      if (stdout.trim() === "OK") return { status: "healthy", message: "Running" };
      return { status: "down", message: "Not reachable" };
    },
  },
  {
    id: "openclaw-gateway",
    name: "OpenClaw Gateway",
    icon: "\ud83d\udd27",
    command: "openclaw gateway status 2>&1",
    parseOutput: (stdout) => {
      const lower = stdout.toLowerCase();
      if (lower.includes("running") || lower.includes("ok") || lower.includes("active"))
        return { status: "healthy", message: "Running" };
      return { status: "down", message: "Stopped" };
    },
  },
  {
    id: "brave-search",
    name: "Brave Search",
    icon: "\ud83e\udd81",
    command: "curl -sf --max-time 5 'https://api.search.brave.com/res/v1/web/search?q=test' -H 'Accept: application/json' 2>&1 | head -1 || echo FAIL",
    parseOutput: (stdout) => {
      if (stdout.includes("FAIL") || stdout.includes("error") || stdout.includes("401"))
        return { status: "degraded", message: "API key may be missing" };
      return { status: "healthy", message: "Working" };
    },
  },
  {
    id: "youtube-api",
    name: "YouTube Data API",
    icon: "\ud83c\udfa5",
    command: "curl -sf --max-time 5 'https://www.googleapis.com/youtube/v3/channels?part=id&mine=true' 2>&1 | head -1 || echo FAIL",
    parseOutput: (stdout) => {
      if (stdout.includes("FAIL") || stdout.includes("error") || stdout.includes("401"))
        return { status: "degraded", message: "Auth may need refresh" };
      return { status: "healthy", message: "Working" };
    },
  },
  {
    id: "perplexity",
    name: "Perplexity",
    icon: "\ud83d\udd0d",
    command: "curl -sf --max-time 5 https://api.perplexity.ai/health 2>&1 | head -1 || echo FAIL",
    parseOutput: (stdout) => {
      if (stdout.includes("FAIL")) return { status: "degraded", message: "API may be unreachable" };
      return { status: "healthy", message: "Working" };
    },
  },
];

// Simple in-memory cache
let cachedResult: { integrations: Integration[]; cachedAt: number } | null = null;
const CACHE_TTL = 60_000; // 60s

async function runCheck(check: CheckDef): Promise<Integration> {
  try {
    const { stdout, stderr } = await execAsync(check.command, { timeout: 10000 });
    const result = check.parseOutput
      ? check.parseOutput(stdout, stderr)
      : { status: "healthy" as const, message: stdout.trim().slice(0, 100) || "OK" };
    return { id: check.id, name: check.name, icon: check.icon, ...result, checkedAt: new Date().toISOString() };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    // Some commands exit non-zero but still have useful output
    if (e && typeof e === "object" && "stdout" in e) {
      const execErr = e as { stdout?: string; stderr?: string };
      const result = check.parseOutput
        ? check.parseOutput(execErr.stdout || "", execErr.stderr || "")
        : { status: "down" as const, message: msg.slice(0, 100) };
      return { id: check.id, name: check.name, icon: check.icon, ...result, checkedAt: new Date().toISOString() };
    }
    return { id: check.id, name: check.name, icon: check.icon, status: "down", message: msg.slice(0, 100), checkedAt: new Date().toISOString() };
  }
}

export async function GET() {
  // Return cached if fresh
  if (cachedResult && Date.now() - cachedResult.cachedAt < CACHE_TTL) {
    return NextResponse.json({ integrations: cachedResult.integrations, cached: true });
  }

  // Run all checks in parallel
  const integrations = await Promise.all(checks.map(runCheck));

  cachedResult = { integrations, cachedAt: Date.now() };
  return NextResponse.json({ integrations, cached: false });
}
