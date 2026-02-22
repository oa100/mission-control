# Mission Control 🐾

A Next.js dashboard for managing OpenClaw operations — cron jobs, memory files, and quick actions.

## Features

### 🏠 Dashboard
Welcome screen with quick navigation to all tools.

### ⏰ Cron Command Center
- View all scheduled cron jobs
- Monitor job status (enabled/disabled, last run, success/failure)
- Manually trigger jobs on demand
- Real-time status indicators

### 🧠 Memory Browser
- Browse all memory files from `~/.openclaw/workspace/memory/`
- View MEMORY.md (long-term memory)
- Search across all memory files with grep
- Markdown rendering with syntax highlighting

### ⚡ Quick Actions
- Pre-configured action cards for common tasks
- One-click execution
- Toast notifications for success/failure
- Customizable via `actions.json`

## Tech Stack

- **Next.js 14+** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **react-markdown** for rendering memory files
- Dark theme (zinc/slate palette with blue accents)

## Setup

### Install Dependencies
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production
```bash
npm run build
npm start
```

## Configuration

### Custom Actions
Edit `actions.json` to add, remove, or modify quick actions:

```json
{
  "actions": [
    {
      "id": "my-action",
      "title": "My Action",
      "description": "Description of what this does",
      "icon": "🚀",
      "command": "echo 'Hello World'"
    }
  ]
}
```

Each action requires:
- **id**: Unique identifier
- **title**: Display name
- **description**: Short description
- **icon**: Emoji icon
- **command**: Shell command to execute

### API Routes

The dashboard uses Next.js API routes to interact with the system:

- `/api/cron/list` - Lists all cron jobs via `openclaw cron list --json`
- `/api/cron/run` - Triggers a specific cron job via `openclaw cron run <jobId>`
- `/api/memory/list` - Lists memory files from `~/.openclaw/workspace/memory/`
- `/api/memory/read` - Reads a specific memory file
- `/api/memory/search` - Greps across all memory files
- `/api/actions/list` - Loads actions from `actions.json`
- `/api/actions/run` - Executes a specific action command

## Security

⚠️ **This dashboard is intended for local use only.**

- No authentication is currently implemented
- All API routes execute shell commands
- Do not expose to the internet without adding proper security measures

## Layout

- **Sidebar Navigation**: Persistent sidebar with Clawdy branding
- **Responsive Design**: Desktop-first, but adapts to smaller screens
- **Dark Theme**: Easy on the eyes for long sessions

## Development Notes

- Components are hand-rolled (no shadcn/ui dependency)
- Tailwind CSS for all styling
- TypeScript for type safety
- No external UI libraries beyond react-markdown

## Future Enhancements

- [ ] Authentication/authorization
- [ ] WebSocket for real-time cron job updates
- [ ] Memory file editing
- [ ] Action execution history
- [ ] Cron job creation/editing UI
- [ ] System metrics dashboard

## License

Built for OpenClaw by Clawdy 🐾
