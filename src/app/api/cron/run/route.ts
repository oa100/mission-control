import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function POST(request: Request) {
  try {
    const { jobId } = await request.json();
    
    if (!jobId) {
      return NextResponse.json(
        { success: false, error: "Job ID is required" },
        { status: 400 }
      );
    }

    const { stdout, stderr } = await execAsync(`openclaw cron run ${jobId}`);
    
    return NextResponse.json({
      success: true,
      output: stdout,
      error: stderr || undefined,
    });
  } catch (error: any) {
    console.error("Failed to run cron job:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to run job" },
      { status: 500 }
    );
  }
}
