import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const TODOIST_SCRIPT = "~/.openclaw/workspace/skills/todoist-tracker/todoist.py";

interface TodoistTask {
  id: string;
  title: string;
  description?: string;
  state: string;
  priority?: number;
  labels?: string[];
  createdAt?: string;
  comments?: string[];
}

export async function GET() {
  try {
    // Try to get tasks from Todoist via the reconcile/list script
    const { stdout } = await execAsync(
      `python3 ${TODOIST_SCRIPT} list --json 2>/dev/null || echo '[]'`,
      { timeout: 15000 }
    );

    let tasks: TodoistTask[];
    try {
      tasks = JSON.parse(stdout.trim());
      if (!Array.isArray(tasks)) tasks = [];
    } catch {
      tasks = [];
    }

    // Group tasks by state → columns
    const columns: Record<string, TodoistTask[]> = {
      queue: [],
      active: [],
      waiting: [],
      done: [],
    };

    for (const task of tasks) {
      const state = task.state || "queue";
      if (state in columns) {
        columns[state].push(task);
      } else {
        columns.queue.push(task);
      }
    }

    return NextResponse.json({ columns });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({
      columns: { queue: [], active: [], waiting: [], done: [] },
      error: msg,
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { title, description, labels } = await request.json();
    if (!title) {
      return NextResponse.json({ success: false, error: "Title is required" }, { status: 400 });
    }

    let cmd = `python3 ${TODOIST_SCRIPT} add --title "${title.replace(/"/g, '\\"')}"`;
    if (description) cmd += ` --description "${description.replace(/"/g, '\\"')}"`;
    if (labels && labels.length > 0) cmd += ` --labels "${labels.join(",")}"`;

    const { stdout } = await execAsync(cmd, { timeout: 15000 });
    return NextResponse.json({ success: true, output: stdout.trim() });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ success: false, error: msg });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { taskId, newState } = await request.json();
    if (!taskId || !newState) {
      return NextResponse.json({ success: false, error: "taskId and newState required" }, { status: 400 });
    }

    const { stdout } = await execAsync(
      `python3 ${TODOIST_SCRIPT} move --id "${taskId}" --state "${newState}"`,
      { timeout: 15000 }
    );
    return NextResponse.json({ success: true, output: stdout.trim() });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ success: false, error: msg });
  }
}
