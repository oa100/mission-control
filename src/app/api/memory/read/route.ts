import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import os from "os";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const file = searchParams.get("file");

    if (!file) {
      return NextResponse.json(
        { error: "File parameter required" },
        { status: 400 }
      );
    }

    // Security: prevent path traversal
    if (file.includes("..")) {
      return NextResponse.json(
        { error: "Invalid file path" },
        { status: 400 }
      );
    }

    const workspaceDir = join(os.homedir(), ".openclaw/workspace");
    const filePath = join(workspaceDir, file);
    const content = await readFile(filePath, "utf-8");

    return NextResponse.json({ content });
  } catch (error) {
    console.error("Failed to read file:", error);
    return NextResponse.json(
      { error: "Failed to read file" },
      { status: 500 }
    );
  }
}
