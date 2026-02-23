"use client";

interface Pipeline {
  id: string;
  name: string;
  description: string;
  icon: string;
  steps: { id: string; name: string }[];
}

interface PipelineCardProps {
  pipeline: Pipeline;
  onClick: () => void;
  active: boolean;
}

export default function PipelineCard({ pipeline, onClick, active }: PipelineCardProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-5 rounded-lg border transition-colors ${
        active
          ? "border-blue-500 bg-zinc-800"
          : "border-zinc-700 bg-zinc-900 hover:border-blue-500 hover:bg-zinc-800"
      }`}
    >
      <div className="text-3xl mb-3">{pipeline.icon}</div>
      <h3 className="text-lg font-semibold mb-1">{pipeline.name}</h3>
      <p className="text-xs text-zinc-400 mb-3">{pipeline.description}</p>
      <div className="text-xs text-zinc-500">
        {pipeline.steps.length} step{pipeline.steps.length !== 1 ? "s" : ""}
      </div>
    </button>
  );
}
