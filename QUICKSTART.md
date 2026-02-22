# Quick Start Guide

## 1. Install Dependencies
```bash
npm install
```

## 2. Start Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 3. Test the Features

### Cron Command Center
Navigate to `/cron` to see all OpenClaw cron jobs.

**Prerequisites:** OpenClaw must be installed and `openclaw cron list --json` must work.

### Memory Browser  
Navigate to `/memory` to browse memory files.

**Prerequisites:** Memory files must exist in `~/.openclaw/workspace/memory/`

### Quick Actions
Navigate to `/actions` to see action cards.

**Customize:** Edit `actions.json` to add your own commands.

## 4. Build for Production
```bash
npm run build
npm start
```

## Troubleshooting

**Q: "openclaw: command not found" errors**  
A: Make sure OpenClaw is installed and in your PATH. The dashboard requires OpenClaw CLI commands.

**Q: Memory files not showing up**  
A: Ensure `~/.openclaw/workspace/memory/` exists and contains `.md` files.

**Q: Actions not executing**  
A: Check that the commands in `actions.json` are valid shell commands.

## File Structure
```
mission-control/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Dashboard home
│   │   ├── cron/page.tsx         # Cron Command Center
│   │   ├── memory/page.tsx       # Memory Browser
│   │   ├── actions/page.tsx      # Quick Actions
│   │   └── api/                  # API routes
│   │       ├── cron/
│   │       ├── memory/
│   │       └── actions/
│   └── components/
│       └── Sidebar.tsx           # Navigation sidebar
├── actions.json                  # Action definitions
└── README.md                     # Full documentation
```

## Next Steps
- Customize `actions.json` with your own commands
- Deploy to Vercel or your preferred hosting
- Add authentication if exposing publicly (NOT recommended without security)
