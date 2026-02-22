import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { readFile } from "fs/promises";
import { join } from "path";

const execAsync = promisify(exec);

export async function POST(request: Request) {
  try {
    const { actionId } = await request.json();

    if (!actionId) {
      return NextResponse.json(
        { success: false, error: "Action ID required" },
        { status: 400 }
      );
    }

    // Load actions config
    const configPath = join(process.cwd(), "actions.json");
    const content = await readFile(configPath, "utf-8");
    const config = JSON.parse(content);

    const action = config.actions.find((a: any) => a.id === actionId);
    if (!action) {
      return NextResponse.json(
        { success: false, error: "Action not found" },
        { status: 404 }
      );
    }

    // Execute the command
    const { stdout, stderr } = await execAsync(action.command, {
      timeout: 30000, // 30 second timeout
    });

    return NextResponse.json({
      success: true,
      output: stdout,
      error: stderr || undefined,
    });
  } catch (error: any) {
    console.error("Failed to run action:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to execute action" },
      { status: 500 }
    );
  }
}
