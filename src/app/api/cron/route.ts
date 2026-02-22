import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function GET() {
  try {
    const { stdout } = await execAsync("openclaw cron list --json 2>/dev/null || echo '[]'");
    const jobs = JSON.parse(stdout.trim() || "[]");
    return NextResponse.json({ jobs });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ jobs: [], error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { jobId, action } = await req.json();
    if (action === "run") {
      const { stdout } = await execAsync(`openclaw cron run ${jobId} 2>&1`);
      return NextResponse.json({ success: true, output: stdout.trim() });
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
