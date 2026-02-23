# Mission Control — Product Requirements Document

## Overview

Mission Control is a local-only Next.js dashboard for managing Clawdy's (OpenClaw AI agent) tooling and automation. It runs on `yalab230` (Ubuntu server, LAN IP `192.168.1.128`) and is accessed from any device on the same network.

**Goal:** Give Yemi a visual, mobile-friendly interface to monitor and control the AI agent's cron jobs, memory files, and common workflows — without needing to type CLI commands or chat with the bot.

## Tech Stack

- **Framework:** Next.js 16+ (App Router)
- **Language:** TypeScript (strict)
- **Styling:** Tailwind CSS v4 (uses `@import "tailwindcss"` — NOT `@tailwind base/components/utilities`)
- **UI:** Hand-rolled components, no external UI libraries (no shadcn, no MUI, no Radix)
- **Fonts:** Geist Sans + Geist Mono (already in scaffold)
- **Auth:** None (local network only)
- **Port:** 3333, bound to `0.0.0.0`

## Design System

### Theme: Dark Mode Only

- Background: `zinc-950` (#09090b)
- Cards: `zinc-900` (#18181b)
- Card hover: `zinc-800` (#27272a)
- Borders: `zinc-700` (#3f3f46)
- Primary text: `zinc-50` (#fafafa)
- Muted text: `zinc-400` (#a1a1aa)
- Accent: `blue-500` (#3b82f6)
- Accent hover: `blue-600` (#2563eb)
- Success: `green-500` (#22c55e)
- Warning: `yellow-500` (#eab308)
- Danger: `red-500` (#ef4444)

### Layout

- **Sidebar:** Fixed left, 256px wide (`w-64`)
  - Top: "🐾 Mission Control" branding + "Clawdy's Dashboard" subtitle
  - Nav: Icon + label links for each tool page
  - Active state: `bg-blue-600 text-white`
  - Inactive: `text-zinc-300 hover:bg-zinc-800`
  - Bottom: Version number + "Local Only" label
- **Main area:** Scrollable, `p-6` padding
- **Responsive:** Desktop-first but must be usable on mobile (sidebar collapses to hamburger menu on small screens)

### Components (build these as reusable)

1. **Card** — Rounded border, zinc-900 bg, zinc-700 border, hover state
2. **Badge** — Small pill with colored bg (green/red/yellow/zinc variants)
3. **Button** — Primary (blue), secondary (zinc-800 border), danger (red)
4. **Toast** — Fixed bottom-right, slide-in animation, auto-dismiss after 3s, click to dismiss
5. **Table** — Full-width, zinc-900 header row, hover states on rows, zinc-700 row borders
6. **Input** — zinc-900 bg, zinc-700 border, focus:border-blue-500
7. **Loading** — Simple "Loading..." centered text with zinc-400 color

---

## Tool 1: Cron Command Center (`/cron`)

### Purpose
View, monitor, and manually trigger all OpenClaw cron jobs.

### Data Source
Shell out to OpenClaw CLI:
- **List jobs:** `openclaw cron list --json`
- **Trigger job:** `openclaw cron run <jobId>`

### API Routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/cron` | Returns `{ jobs: CronJob[] }` |
| POST | `/api/cron` | Body: `{ jobId: string, action: "run" }`. Triggers the job. Returns `{ success: boolean, output?: string, error?: string }` |

### CronJob Interface
```typescript
interface CronJob {
  id: string;           // or jobId
  jobId?: string;
  name?: string;
  schedule?: {
    kind?: string;      // "cron" | "every" | "at"
    expr?: string;      // cron expression
    everyMs?: number;
  };
  payload?: {
    kind?: string;      // "systemEvent" | "agentTurn"
    text?: string;
    message?: string;
  };
  enabled?: boolean;
  lastRun?: {
    status?: string;    // "ok" | "success" | "error" | "failed"
    at?: string;        // ISO timestamp
    error?: string;
  };
  sessionTarget?: string;
}
```

### UI

- **Header:** "⏰ Cron Command Center" + job count + Refresh button
- **Table columns:** Name (+ ID in mono below), Schedule, Status (badge), Last Run (relative time), Actions (Run button)
- **Status badges:**
  - OK/Success: Green badge "OK"
  - Error/Failed: Red badge "Failed"
  - Disabled: Yellow badge "Disabled"
  - No data: Zinc badge "—"
- **Schedule display:**
  - `cron` kind: show the cron expression
  - `every` kind: show "every Xm" (convert ms to minutes)
  - `at` kind: show ISO date
- **Last Run:** Show relative time ("just now", "5m ago", "2h ago", "3d ago")
- **Run button:** Blue, shows "Running..." while in progress, disabled during run
- **After trigger:** Show toast with result, refresh job list after 2s
- **Error handling:** If `openclaw cron list --json` fails, show friendly error message

---

## Tool 2: Memory Browser (`/memory`)

### Purpose
Browse, read, and search across all memory files (daily logs + MEMORY.md).

### Data Source
Read files from disk:
- **Workspace:** `~/.openclaw/workspace/` (resolve `~` to `process.env.HOME`)
- **Memory dir:** `~/.openclaw/workspace/memory/`
- **Key file:** `~/.openclaw/workspace/MEMORY.md`

### API Routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/memory` | No params: returns `{ files: MemFile[] }`. With `?file=<name>`: returns `{ file: string, content: string }`. With `?q=<search>`: returns `{ results: SearchResult[] }` |

### Interfaces
```typescript
interface MemFile {
  name: string;
  size: number;
  modified: string;   // ISO timestamp
}

interface SearchResult {
  file: string;
  line: string;
  lineNum: number;
}
```

### API Logic

**List files:**
1. Read `MEMORY.md` stat from workspace root
2. Read all files from `memory/` directory
3. Return combined list sorted by name descending (newest dates first, MEMORY.md at top)

**Read file:**
1. If `file` param is "MEMORY.md", read from workspace root
2. Otherwise read from `memory/<file>`
3. **Security:** Validate resolved path starts with workspace dir (prevent path traversal)

**Search:**
1. Search is case-insensitive substring match across all lines
2. Search MEMORY.md first, then all files in memory/ dir
3. Return first 50 matches with file name, matching line text (trimmed), and line number

### UI

- **Header:** "🧠 Memory Browser" + file count
- **Search bar:** Full width input + Search button. Enter key triggers search. Shows "..." while searching.
- **Two-column layout:**
  - **Left sidebar (w-64):** Scrollable file list, max-height 70vh
    - Each file: name (truncated) + size in KB/B
    - Active file: blue background
    - Click to load file content
  - **Right main area (flex-1):**
    - **File view:** Card with filename header (blue text) + content in `<pre>` with monospace font, whitespace-pre-wrap
    - **Search results:** List of clickable result cards showing file name (blue) + line number + truncated matching line. Click opens that file.
    - **Empty state:** "Select a file or search to get started"

---

## Tool 3: Quick Actions (`/actions`)

### Purpose
One-click execution of common shell commands and workflows.

### Data Source
- **Config file:** `actions.json` in project root
- **Execution:** Shell out via `child_process.exec` with 30s timeout

### API Routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/actions` | Returns `{ actions: Action[] }` from actions.json |
| POST | `/api/actions` | Body: `{ id: string, command: string }`. Executes command. Returns `{ id, success: boolean, output?: string, error?: string }` |

### Action Interface
```typescript
interface Action {
  id: string;
  icon: string;       // emoji
  title: string;
  desc: string;
  command: string;     // shell command to execute
}
```

### Pre-loaded Actions (actions.json)

```json
[
  {
    "id": "weather",
    "icon": "🌤️",
    "title": "Weather Check",
    "desc": "Get current Dallas weather",
    "command": "curl -s 'https://api.open-meteo.com/v1/forecast?latitude=33.23&longitude=-96.80&current=temperature_2m,weathercode&temperature_unit=fahrenheit&timezone=America/Chicago' | python3 -c \"import sys,json;d=json.load(sys.stdin)['current'];print(f\\\"Prosper TX: {d['temperature_2m']}°F (code {d['weathercode']})\\\")\""
  },
  {
    "id": "git-status",
    "icon": "📦",
    "title": "Git Status",
    "desc": "Check workspace git status",
    "command": "cd ~/.openclaw && git status --short | head -20 || echo 'Clean'"
  },
  {
    "id": "disk-usage",
    "icon": "💾",
    "title": "Disk Usage",
    "desc": "Check disk space",
    "command": "df -h / | tail -1 | awk '{print \"Used: \"$3\" / \"$2\" (\"$5\")\"}'"
  },
  {
    "id": "cron-health",
    "icon": "🩺",
    "title": "Cron Health",
    "desc": "Check for failed cron jobs",
    "command": "openclaw cron list 2>/dev/null | grep -c 'error' || echo '0 failed'"
  },
  {
    "id": "memory-size",
    "icon": "🧠",
    "title": "Memory Stats",
    "desc": "Check memory file sizes",
    "command": "echo \"MEMORY.md: $(wc -c < ~/.openclaw/workspace/MEMORY.md) bytes\"; echo \"Daily files: $(ls ~/.openclaw/workspace/memory/*.md 2>/dev/null | wc -l)\"; echo \"Total: $(du -sh ~/.openclaw/workspace/memory/ 2>/dev/null | cut -f1)\""
  }
]
```

### UI

- **Header:** "⚡ Quick Actions" + subtitle "One-click workflows and diagnostics"
- **Grid:** 1 col on mobile, 2 on md, 3 on lg (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`)
- **Action cards:**
  - Large emoji icon (text-2xl)
  - Title (font-semibold)
  - Description (text-xs, zinc-400)
  - "▶ Run" button (full width, blue)
  - Output area (appears after run): monospace text in green-tinted card (success) or red-tinted card (error)
- **Run button:** Shows "Running..." while executing, disabled during run
- **Only one action can run at a time** (disable all other Run buttons while one is running)

---

## Home Page (`/`)

- **Header:** "Mission Control 🐾" + subtitle
- **Grid of 3 cards** linking to each tool (1 col mobile, 3 col desktop)
- Each card: Large emoji, title, description, entire card is clickable link
- Card hover: border changes to blue, slight bg change

---

## Critical Implementation Notes

### Tailwind v4
This project uses **Tailwind CSS v4**. The globals.css MUST use:
```css
@import "tailwindcss";
```
Do NOT use `@tailwind base; @tailwind components; @tailwind utilities;` — that's Tailwind v3 syntax and will cause all styles to fail silently.

### API Route Structure
Use single route files with method handlers, NOT subdirectories:
- ✅ `src/app/api/cron/route.ts` (exports GET and POST)
- ❌ `src/app/api/cron/list/route.ts` + `src/app/api/cron/run/route.ts`

The frontend pages call `/api/cron`, `/api/memory`, `/api/actions` — the API routes MUST match these paths exactly.

### Shell Execution Safety
- All `exec()` calls must have a `timeout: 30000` (30s)
- Catch errors and return proper JSON error responses
- Memory file reads must validate paths start with workspace dir (prevent traversal)

### Mobile Responsiveness
- Sidebar should collapse on screens < 768px
- Use a hamburger menu button to toggle sidebar visibility on mobile
- Main content should be full-width on mobile

### Error Handling
- Every API route wraps in try/catch
- Every fetch in frontend has error handling
- Show user-friendly error messages, not raw stack traces

---

## File Structure (target)

```
mission-control/
├── actions.json                    # Quick actions config
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts              # (if needed by v4)
├── tsconfig.json
├── PRD.md                          # This file
├── README.md
├── public/
├── src/
│   ├── app/
│   │   ├── globals.css             # @import "tailwindcss" + custom animations
│   │   ├── layout.tsx              # Root layout with Sidebar
│   │   ├── page.tsx                # Home page with 3 tool cards
│   │   ├── cron/
│   │   │   └── page.tsx            # Cron Command Center
│   │   ├── memory/
│   │   │   └── page.tsx            # Memory Browser
│   │   ├── actions/
│   │   │   └── page.tsx            # Quick Actions
│   │   └── api/
│   │       ├── cron/
│   │       │   └── route.ts        # GET (list) + POST (run)
│   │       ├── memory/
│   │       │   └── route.ts        # GET (list/read/search via query params)
│   │       └── actions/
│   │           └── route.ts        # GET (list) + POST (run)
│   └── components/
│       └── Sidebar.tsx             # Sidebar navigation
```

## Current State & What's Broken

The scaffold exists with `npm run build` passing, but the app doesn't work because:

1. **API route mismatch:** Pages call `/api/cron` but routes are at `/api/cron/list` and `/api/cron/run` (sub-agent created subdirectory structure). Fix: delete subdirectories, create single `route.ts` per API with GET+POST handlers.
2. **CSS was broken:** Was using Tailwind v3 `@tailwind` directives. Fixed to `@import "tailwindcss"` — dark theme now loads.
3. **Duplicate/conflicting files:** Two build passes left conflicting versions of pages and API routes. Clean slate the `src/app/api/` directory and rebuild from this PRD.

## Definition of Done

- [ ] `npm run build` passes with zero errors
- [ ] All 3 tool pages load and display data
- [ ] Cron page lists jobs from `openclaw cron list --json` and can trigger runs
- [ ] Memory page lists files, displays content, and search works
- [ ] Actions page loads from actions.json and executes commands
- [ ] Dark theme renders correctly (no white/unstyled pages)
- [ ] Works on mobile browser (sidebar collapses)
- [ ] Toast notifications appear and auto-dismiss
- [ ] Git committed with clean history
