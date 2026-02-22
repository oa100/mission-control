import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

export async function GET() {
  try {
    const configPath = join(process.cwd(), "actions.json");
    const content = await readFile(configPath, "utf-8");
    const config = JSON.parse(content);
    return NextResponse.json(config);
  } catch (error) {
    console.error("Failed to load actions config:", error);
    return NextResponse.json(
      { actions: [] },
      { status: 500 }
    );
  }
}
