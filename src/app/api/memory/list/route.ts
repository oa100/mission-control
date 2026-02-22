import { NextResponse } from "next/server";
import { readdir, stat } from "fs/promises";
import { join } from "path";
import os from "os";

export async function GET() {
  try {
    const memoryDir = join(os.homedir(), ".openclaw/workspace/memory");
    const files = await readdir(memoryDir);
    
    const fileDetails = await Promise.all(
      files
        .filter((f) => f.endsWith(".md"))
        .map(async (file) => {
          const filePath = join(memoryDir, file);
          const stats = await stat(filePath);
          return {
            name: file,
            path: `memory/${file}`,
            modified: stats.mtime.toLocaleDateString(),
          };
        })
    );

    // Sort by date (newest first)
    fileDetails.sort((a, b) => {
      const dateA = new Date(a.modified).getTime();
      const dateB = new Date(b.modified).getTime();
      return dateB - dateA;
    });

    return NextResponse.json({ files: fileDetails });
  } catch (error) {
    console.error("Failed to list memory files:", error);
    return NextResponse.json({ files: [] }, { status: 500 });
  }
}
