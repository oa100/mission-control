import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import os from "os";
import { join } from "path";

const execAsync = promisify(exec);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query) {
      return NextResponse.json({ results: [] });
    }

    const memoryDir = join(os.homedir(), ".openclaw/workspace/memory");
    
    // Use grep to search across all markdown files
    const { stdout } = await execAsync(
      `grep -r -i -n "${query.replace(/"/g, '\\"')}" "${memoryDir}" --include="*.md" || true`
    );

    const results = stdout
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => {
        const [filePath, ...rest] = line.split(":");
        const match = rest.join(":").trim();
        const fileName = filePath.replace(memoryDir + "/", "");
        return { file: `memory/${fileName}`, match };
      })
      .slice(0, 20); // Limit to 20 results

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Search failed:", error);
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}
