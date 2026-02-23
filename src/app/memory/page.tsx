"use client";
import { useEffect, useState, useCallback } from "react";

interface MemFile { name: string; size: number; modified: string }
interface SearchResult { file: string; line: string; lineNum: number }

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  return `${(bytes / 1024).toFixed(1)}KB`;
}

export default function MemoryPage() {
  const [files, setFiles] = useState<MemFile[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [content, setContent] = useState<string>("");
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchFiles = useCallback(async () => {
    try {
      const res = await fetch("/api/memory");
      const data = await res.json();
      setFiles(data.files || []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  async function loadFile(name: string) {
    setSelected(name);
    setResults([]);
    const res = await fetch(`/api/memory?file=${encodeURIComponent(name)}`);
    const data = await res.json();
    setContent(data.content || "Error loading file");
  }

  async function doSearch() {
    if (!search.trim()) return;
    setSearching(true);
    setSelected(null);
    try {
      const res = await fetch(`/api/memory?q=${encodeURIComponent(search)}`);
      const data = await res.json();
      setResults(data.results || []);
    } finally { setSearching(false); }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">🧠 Memory Browser</h1>
        <p className="text-sm text-zinc-400">{files.length} files</p>
      </div>

      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && doSearch()}
          placeholder="Search across all memory files..."
          className="flex-1 px-3 py-2 rounded-md bg-zinc-900 border border-zinc-700 text-sm focus:outline-none focus:border-blue-500"
        />
        <button onClick={doSearch} disabled={searching} className="px-4 py-2 text-sm rounded-md bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50">
          {searching ? "..." : "Search"}
        </button>
      </div>

      <div className="flex gap-4">
        <div className="w-64 shrink-0">
          {loading ? (
            <div className="text-zinc-400 text-sm">Loading...</div>
          ) : (
            <div className="space-y-1 max-h-[70vh] overflow-auto">
              {files.map((f) => (
                <button
                  key={f.name}
                  onClick={() => loadFile(f.name)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    selected === f.name ? "bg-blue-500 text-white" : "hover:bg-zinc-800"
                  }`}
                >
                  <div className="font-medium truncate">{f.name}</div>
                  <div className="text-xs opacity-60">{formatSize(f.size)}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 min-h-[50vh]">
          {results.length > 0 ? (
            <div className="space-y-2">
              <h2 className="text-sm font-medium text-zinc-400 mb-3">{results.length} results for &quot;{search}&quot;</h2>
              {results.map((r, i) => (
                <button key={i} onClick={() => loadFile(r.file)} className="w-full text-left p-3 rounded-md bg-zinc-900 border border-zinc-700 hover:border-blue-500 text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-blue-500">{r.file}</span>
                    <span className="text-xs text-zinc-400">line {r.lineNum}</span>
                  </div>
                  <div className="text-zinc-400 truncate">{r.line}</div>
                </button>
              ))}
            </div>
          ) : selected ? (
            <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4">
              <h2 className="text-sm font-medium text-blue-500 mb-3">{selected}</h2>
              <pre className="text-sm whitespace-pre-wrap font-mono leading-relaxed text-zinc-400">{content}</pre>
            </div>
          ) : (
            <div className="text-zinc-400 text-sm py-12 text-center">Select a file or search to get started</div>
          )}
        </div>
      </div>
    </div>
  );
}
