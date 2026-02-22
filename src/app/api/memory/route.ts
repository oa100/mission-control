import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const WORKSPACE = process.env.HOME + "/.openclaw/workspace";
const MEMORY_DIR = path.join(WORKSPACE, "memory");

export async function GET(req: NextRequest) {
  const file = req.nextUrl.searchParams.get("file");
  const search = req.nextUrl.searchParams.get("q");

  try {
    // Return specific file content
    if (file) {
      let filePath: string;
      if (file === "MEMORY.md") {
        filePath = path.join(WORKSPACE, "MEMORY.md");
      } else {
        filePath = path.join(MEMORY_DIR, file);
      }
      // Prevent path traversal
      if (!filePath.startsWith(WORKSPACE)) {
        return NextResponse.json({ error: "Invalid path" }, { status: 400 });
      }
      const content = await fs.readFile(filePath, "utf-8");
      return NextResponse.json({ file, content });
    }

    // Search across memory files
    if (search) {
      const results: { file: string; line: string; lineNum: number }[] = [];
      const query = search.toLowerCase();

      // Search MEMORY.md
      try {
        const mem = await fs.readFile(path.join(WORKSPACE, "MEMORY.md"), "utf-8");
        mem.split("\n").forEach((line, i) => {
          if (line.toLowerCase().includes(query)) {
            results.push({ file: "MEMORY.md", line: line.trim(), lineNum: i + 1 });
          }
        });
      } catch { /* skip */ }

      // Search daily files
      try {
        const files = await fs.readdir(MEMORY_DIR);
        for (const f of files) {
          const content = await fs.readFile(path.join(MEMORY_DIR, f), "utf-8");
          content.split("\n").forEach((line, i) => {
            if (line.toLowerCase().includes(query)) {
              results.push({ file: f, line: line.trim(), lineNum: i + 1 });
            }
          });
        }
      } catch { /* skip */ }

      return NextResponse.json({ results: results.slice(0, 50) });
    }

    // List all memory files
    const files: { name: string; size: number; modified: string }[] = [];

    // Add MEMORY.md
    try {
      const stat = await fs.stat(path.join(WORKSPACE, "MEMORY.md"));
      files.push({ name: "MEMORY.md", size: stat.size, modified: stat.mtime.toISOString() });
    } catch { /* skip */ }

    // Add daily files
    try {
      const dirFiles = await fs.readdir(MEMORY_DIR);
      for (const f of dirFiles) {
        const stat = await fs.stat(path.join(MEMORY_DIR, f));
        files.push({ name: f, size: stat.size, modified: stat.mtime.toISOString() });
      }
    } catch { /* skip */ }

    // Sort by name descending (newest dates first)
    files.sort((a, b) => b.name.localeCompare(a.name));

    return NextResponse.json({ files });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
