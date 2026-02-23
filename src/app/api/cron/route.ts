import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function GET() {
  try {
    const { stdout } = await execAsync("openclaw cron list --json", { timeout: 30000 });
    const parsed = JSON.parse(stdout);
    const jobs = Array.isArray(parsed) ? parsed : (parsed.jobs ?? []);
    return NextResponse.json({ jobs });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ jobs: [], error: msg }, { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { jobId } = await request.json();
    if (!jobId) {
      return NextResponse.json({ success: false, error: "Missing jobId" }, { status: 400 });
    }
    const { stdout, stderr } = await execAsync(`openclaw cron run ${jobId}`, { timeout: 30000 });
    return NextResponse.json({ success: true, output: stdout || stderr });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ success: false, error: msg });
  }
}
