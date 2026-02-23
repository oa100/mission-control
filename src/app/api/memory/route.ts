import { NextRequest, NextResponse } from "next/server";
import { readdir, readFile, stat } from "fs/promises";
import path from "path";

const HOME = process.env.HOME || "/root";
const WORKSPACE = path.join(HOME, ".openclaw", "workspace");
const MEMORY_DIR = path.join(WORKSPACE, "memory");

function safePath(filePath: string): boolean {
  const resolved = path.resolve(filePath);
  return resolved.startsWith(WORKSPACE);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const file = searchParams.get("file");
  const q = searchParams.get("q");

  try {
    // Read a specific file
    if (file) {
      const filePath = file === "MEMORY.md"
        ? path.join(WORKSPACE, "MEMORY.md")
        : path.join(MEMORY_DIR, file);

      if (!safePath(filePath)) {
        return NextResponse.json({ error: "Invalid path" }, { status: 403 });
      }

      const content = await readFile(filePath, "utf-8");
      return NextResponse.json({ file, content });
    }

    // Search across files
    if (q) {
      const query = q.toLowerCase();
      const results: { file: string; line: string; lineNum: number }[] = [];

      async function searchFile(name: string, fullPath: string) {
        try {
          const text = await readFile(fullPath, "utf-8");
          const lines = text.split("\n");
          for (let i = 0; i < lines.length && results.length < 50; i++) {
            if (lines[i].toLowerCase().includes(query)) {
              results.push({ file: name, line: lines[i].trim(), lineNum: i + 1 });
            }
          }
        } catch { /* skip unreadable files */ }
      }

      // Search MEMORY.md first
      await searchFile("MEMORY.md", path.join(WORKSPACE, "MEMORY.md"));

      // Then search memory dir
      try {
        const entries = await readdir(MEMORY_DIR);
        for (const entry of entries) {
          if (results.length >= 50) break;
          await searchFile(entry, path.join(MEMORY_DIR, entry));
        }
      } catch { /* memory dir may not exist */ }

      return NextResponse.json({ results });
    }

    // List all files
    const files: { name: string; size: number; modified: string }[] = [];

    // Add MEMORY.md
    try {
      const s = await stat(path.join(WORKSPACE, "MEMORY.md"));
      files.push({ name: "MEMORY.md", size: s.size, modified: s.mtime.toISOString() });
    } catch { /* MEMORY.md may not exist */ }

    // Add memory dir files
    try {
      const entries = await readdir(MEMORY_DIR);
      for (const entry of entries) {
        try {
          const s = await stat(path.join(MEMORY_DIR, entry));
          if (s.isFile()) {
            files.push({ name: entry, size: s.size, modified: s.mtime.toISOString() });
          }
        } catch { /* skip */ }
      }
    } catch { /* memory dir may not exist */ }

    // Sort: MEMORY.md first, then by name descending
    files.sort((a, b) => {
      if (a.name === "MEMORY.md") return -1;
      if (b.name === "MEMORY.md") return 1;
      return b.name.localeCompare(a.name);
    });

    return NextResponse.json({ files });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
