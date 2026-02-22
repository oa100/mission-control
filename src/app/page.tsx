export default function Home() {
  return (
    <div className="max-w-6xl">
      <h1 className="text-4xl font-bold text-white mb-4">Mission Control</h1>
      <p className="text-zinc-400 text-lg mb-8">
        Welcome to Clawdy&apos;s Mission Control Dashboard
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <div className="text-3xl mb-3">⏰</div>
          <h2 className="text-xl font-semibold text-white mb-2">Cron Center</h2>
          <p className="text-zinc-400 text-sm">
            Manage and monitor your scheduled jobs
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <div className="text-3xl mb-3">🧠</div>
          <h2 className="text-xl font-semibold text-white mb-2">Memory Browser</h2>
          <p className="text-zinc-400 text-sm">
            Browse and search through memory files
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <div className="text-3xl mb-3">⚡</div>
          <h2 className="text-xl font-semibold text-white mb-2">Quick Actions</h2>
          <p className="text-zinc-400 text-sm">
            Execute commands with a single click
          </p>
        </div>
      </div>
    </div>
  );
}
