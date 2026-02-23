import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile } from "fs/promises";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

interface TimelineEvent {
  id: string;
  title: string;
  date: string;
  endDate?: string;
  icon?: string;
  color?: string;
  category: string;
  source: "manual" | "github" | "cron" | "revenue";
}

interface TimelineData {
  milestones: {
    id: string;
    title: string;
    date: string;
    endDate?: string;
    icon?: string;
    color?: string;
    category: string;
  }[];
}

async function loadManualMilestones(): Promise<TimelineEvent[]> {
  try {
    const filePath = path.join(process.cwd(), "timeline.json");
    const raw = await readFile(filePath, "utf-8");
    const data: TimelineData = JSON.parse(raw);
    return (data.milestones || []).map((m) => ({
      ...m,
      source: "manual" as const,
    }));
  } catch {
    return [];
  }
}

async function loadGitHubIssues(): Promise<TimelineEvent[]> {
  try {
    const { stdout } = await execAsync(
      'gh issue list --json number,title,milestone,labels --limit 50 2>/dev/null || echo "[]"',
      { timeout: 10000 }
    );
    const issues = JSON.parse(stdout.trim());
    if (!Array.isArray(issues)) return [];

    return issues
      .filter((i: { milestone?: { dueOn?: string } }) => i.milestone?.dueOn)
      .map((i: { number: number; title: string; milestone: { dueOn: string; title: string } }) => ({
        id: `gh-${i.number}`,
        title: `${i.title}`,
        date: i.milestone.dueOn.split("T")[0],
        icon: "\ud83d\udc19",
        color: "#3b82f6",
        category: "work",
        source: "github" as const,
      }));
  } catch {
    return [];
  }
}

async function loadRevenueGoals(): Promise<TimelineEvent[]> {
  try {
    const filePath = path.join(process.cwd(), "revenue.json");
    const raw = await readFile(filePath, "utf-8");
    const data = JSON.parse(raw);
    return (data.goals || []).map((g: { label: string; deadline: string }, i: number) => ({
      id: `revenue-goal-${i}`,
      title: g.label,
      date: g.deadline,
      icon: "\ud83d\udcb0",
      color: "#10b981",
      category: "revenue",
      source: "revenue" as const,
    }));
  } catch {
    return [];
  }
}

export async function GET() {
  try {
    // Fetch from all sources in parallel
    const [manual, github, revenue] = await Promise.all([
      loadManualMilestones(),
      loadGitHubIssues(),
      loadRevenueGoals(),
    ]);

    const events = [...manual, ...github, ...revenue].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return NextResponse.json({ events });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ events: [], error: msg });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { title, date, endDate, icon, color, category } = await request.json();
    if (!title || !date) {
      return NextResponse.json({ success: false, error: "title and date required" }, { status: 400 });
    }

    const filePath = path.join(process.cwd(), "timeline.json");
    let data: TimelineData;
    try {
      const raw = await readFile(filePath, "utf-8");
      data = JSON.parse(raw);
    } catch {
      data = { milestones: [] };
    }

    const id = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    data.milestones.push({
      id,
      title,
      date,
      ...(endDate && { endDate }),
      ...(icon && { icon }),
      ...(color && { color }),
      category: category || "personal",
    });

    // Backup then write
    try {
      const existing = await readFile(filePath, "utf-8");
      await writeFile(filePath + ".bak", existing);
    } catch { /* no existing file to back up */ }

    await writeFile(filePath, JSON.stringify(data, null, 2));
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ success: false, error: msg });
  }
}
