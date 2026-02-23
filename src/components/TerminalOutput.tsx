"use client";

import { useEffect, useRef } from "react";

interface TerminalOutputProps {
  lines: string[];
  onClear: () => void;
}

export default function TerminalOutput({ lines, onClear }: TerminalOutputProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  if (lines.length === 0) return null;

  return (
    <div className="mt-4 rounded-lg border border-zinc-700 bg-zinc-950 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-zinc-900 border-b border-zinc-700">
        <span className="text-xs text-zinc-400 font-mono">Output</span>
        <button
          onClick={onClear}
          className="text-xs text-zinc-500 hover:text-zinc-300"
        >
          Clear
        </button>
      </div>
      <div className="p-3 max-h-64 overflow-y-auto">
        <pre className="text-xs font-mono whitespace-pre-wrap text-green-400 leading-relaxed">
          {lines.join("\n")}
        </pre>
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
