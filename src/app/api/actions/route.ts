import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";

const execAsync = promisify(exec);
const ACTIONS_PATH = path.join(process.cwd(), "actions.json");

export async function GET() {
  try {
    const data = await fs.readFile(ACTIONS_PATH, "utf-8");
    return NextResponse.json({ actions: JSON.parse(data) });
  } catch {
    return NextResponse.json({ actions: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { id, command } = await req.json();
    if (!command) return NextResponse.json({ error: "No command" }, { status: 400 });
    const { stdout, stderr } = await execAsync(command, { timeout: 30000 });
    return NextResponse.json({ id, success: true, output: stdout.trim(), stderr: stderr.trim() });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
