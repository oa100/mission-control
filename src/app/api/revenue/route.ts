import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile } from "fs/promises";
import path from "path";

interface Entry {
  date: string;
  amount: number;
  description: string;
  category?: string;
}

interface Business {
  id: string;
  name: string;
  icon: string;
  color: string;
  entries: Entry[];
}

interface RevenueData {
  businesses: Business[];
  goals: { label: string; target: number; deadline: string }[];
}

const REVENUE_PATH = path.join(process.cwd(), "revenue.json");

async function loadRevenue(): Promise<RevenueData> {
  const raw = await readFile(REVENUE_PATH, "utf-8");
  return JSON.parse(raw);
}

function computeAggregations(data: RevenueData) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // YTD totals per business
  const businessTotals: Record<string, number> = {};
  const monthlyBreakdown: Record<string, Record<string, number>> = {};

  let totalYTD = 0;
  let lastMonthTotal = 0;
  let thisMonthTotal = 0;

  for (const biz of data.businesses) {
    businessTotals[biz.id] = 0;

    for (const entry of biz.entries || []) {
      const d = new Date(entry.date);
      if (d.getFullYear() !== currentYear) continue;

      businessTotals[biz.id] += entry.amount;
      totalYTD += entry.amount;

      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!monthlyBreakdown[monthKey]) monthlyBreakdown[monthKey] = {};
      monthlyBreakdown[monthKey][biz.id] = (monthlyBreakdown[monthKey][biz.id] || 0) + entry.amount;

      if (d.getMonth() === currentMonth) thisMonthTotal += entry.amount;
      if (d.getMonth() === currentMonth - 1) lastMonthTotal += entry.amount;
    }
  }

  // Goal progress
  const goals = data.goals.map((g) => ({
    ...g,
    current: totalYTD,
    progress: Math.min(100, Math.round((totalYTD / g.target) * 100)),
  }));

  return {
    totalYTD,
    thisMonthTotal,
    lastMonthTotal,
    trend: thisMonthTotal >= lastMonthTotal ? "up" : "down",
    businessTotals,
    monthlyBreakdown,
    goals,
  };
}

export async function GET() {
  try {
    const data = await loadRevenue();
    const aggregations = computeAggregations(data);
    return NextResponse.json({ businesses: data.businesses, ...aggregations });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg, businesses: [], totalYTD: 0, goals: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { businessId, amount, date, description, category } = await request.json();
    if (!businessId || !amount || !date) {
      return NextResponse.json({ success: false, error: "businessId, amount, and date required" }, { status: 400 });
    }

    const data = await loadRevenue();
    const biz = data.businesses.find((b) => b.id === businessId);
    if (!biz) {
      return NextResponse.json({ success: false, error: `Business "${businessId}" not found` }, { status: 404 });
    }

    // Create backup
    try {
      const existing = await readFile(REVENUE_PATH, "utf-8");
      await writeFile(REVENUE_PATH + ".bak", existing);
    } catch { /* no existing to back up */ }

    if (!biz.entries) biz.entries = [];
    biz.entries.push({
      date,
      amount: Number(amount),
      description: description || "",
      ...(category && { category }),
    });

    await writeFile(REVENUE_PATH, JSON.stringify(data, null, 2));
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ success: false, error: msg });
  }
}
