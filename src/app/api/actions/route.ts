import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "actions.json");
    const raw = await readFile(filePath, "utf-8");
    const actions = JSON.parse(raw);
    return NextResponse.json({ actions: Array.isArray(actions) ? actions : [] });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ actions: [], error: msg });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { id, command } = await request.json();
    if (!command) {
      return NextResponse.json({ id, success: false, error: "Missing command" }, { status: 400 });
    }
    const { stdout, stderr } = await execAsync(command, { timeout: 30000 });
    return NextResponse.json({ id, success: true, output: stdout || stderr || "Done" });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ id: "", success: false, error: msg });
  }
}
