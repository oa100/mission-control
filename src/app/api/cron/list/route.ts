import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function GET() {
  try {
    const { stdout } = await execAsync("openclaw cron list --json");
    const data = JSON.parse(stdout);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to list cron jobs:", error);
    return NextResponse.json(
      { jobs: [], error: "Failed to fetch cron jobs" },
      { status: 500 }
    );
  }
}
