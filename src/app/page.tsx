import Link from "next/link";

const tools = [
  {
    href: "/cron",
    icon: "⏰",
    title: "Cron Command Center",
    description: "Manage and monitor your scheduled jobs",
  },
  {
    href: "/memory",
    icon: "🧠",
    title: "Memory Browser",
    description: "Browse and search through memory files",
  },
  {
    href: "/actions",
    icon: "⚡",
    title: "Quick Actions",
    description: "Execute commands with a single click",
  },
  {
    href: "/pipelines",
    icon: "🚀",
    title: "Pipeline Runner",
    description: "One-click pipeline execution",
  },
];

export default function Home() {
  return (
    <div className="max-w-6xl">
      <h1 className="text-4xl font-bold text-white mb-4">Mission Control 🐾</h1>
      <p className="text-zinc-400 text-lg mb-8">
        Welcome to Clawdy&apos;s Mission Control Dashboard
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {tools.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="block bg-zinc-900 border border-zinc-700 rounded-lg p-6 transition-colors hover:border-blue-500 hover:bg-zinc-800"
          >
            <div className="text-3xl mb-3">{tool.icon}</div>
            <h2 className="text-xl font-semibold text-white mb-2">{tool.title}</h2>
            <p className="text-zinc-400 text-sm">{tool.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
