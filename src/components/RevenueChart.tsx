"use client";

interface RevenueChartProps {
  monthlyBreakdown: Record<string, Record<string, number>>;
  businessId: string;
  color: string;
}

export default function RevenueChart({ monthlyBreakdown, businessId, color }: RevenueChartProps) {
  // Get last 6 months
  const now = new Date();
  const months: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  const values = months.map((m) => monthlyBreakdown[m]?.[businessId] || 0);
  const max = Math.max(...values, 1);

  return (
    <div className="flex items-end gap-1 h-10">
      {values.map((val, i) => (
        <div
          key={months[i]}
          className="flex-1 rounded-t"
          style={{
            height: `${Math.max((val / max) * 100, 4)}%`,
            backgroundColor: val > 0 ? color : "#3f3f46",
            minHeight: "2px",
          }}
          title={`${months[i]}: $${val.toLocaleString()}`}
        />
      ))}
    </div>
  );
}
