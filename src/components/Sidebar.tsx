"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navItems = [
  { href: "/", label: "Dashboard", icon: "🏠" },
  { href: "/cron", label: "Cron Center", icon: "⏰" },
  { href: "/memory", label: "Memory Browser", icon: "🧠" },
  { href: "/actions", label: "Quick Actions", icon: "⚡" },
  { href: "/pipelines", label: "Pipelines", icon: "🚀" },
  { href: "/kanban", label: "Kanban Board", icon: "📋" },
  { href: "/revenue", label: "Revenue Tracker", icon: "💰" },
  { href: "/timeline", label: "Timeline", icon: "📅" },
  { href: "/integrations", label: "Integrations", icon: "🔗" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-md bg-zinc-900 border border-zinc-700 text-zinc-50"
        aria-label="Toggle menu"
      >
        {open ? "✕" : "☰"}
      </button>

      {/* Overlay on mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static z-40 h-full w-64 bg-zinc-900 border-r border-zinc-700 flex flex-col
        transition-transform duration-200 ease-in-out
        ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0
      `}>
        <div className="p-6 border-b border-zinc-700">
          <h1 className="text-2xl font-bold text-blue-400">🐾 Mission Control</h1>
          <p className="text-sm text-zinc-400 mt-1">Clawdy&apos;s Dashboard</p>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-zinc-700 text-xs text-zinc-500">
          <p>OpenClaw v1.0</p>
          <p className="mt-1">Local Only</p>
        </div>
      </aside>
    </>
  );
}
