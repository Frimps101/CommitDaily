"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Day = { date: string; count: number };

/**
 * Cumulative contributions vs. the straight-line pace needed to reach the goal.
 * Lets you see at a glance whether you're above or below the line to 1,000.
 */
export function TrendChart({
  days,
  goalTotal,
  deadline,
}: {
  days: Day[];
  goalTotal: number;
  deadline: string;
}) {
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  if (sorted.length === 0) {
    return null;
  }

  const yearStart = `${deadline.slice(0, 4)}-01-01`;
  const totalDays = Math.max(
    1,
    Math.round(
      (new Date(deadline).getTime() - new Date(yearStart).getTime()) / 86_400_000,
    ) + 1,
  );

  let running = 0;
  const data = sorted.map((d) => {
    running += d.count;
    const dayIndex =
      Math.round(
        (new Date(d.date).getTime() - new Date(yearStart).getTime()) / 86_400_000,
      ) + 1;
    return {
      date: d.date.slice(5),
      cumulative: running,
      target: Math.round((goalTotal / totalDays) * dayIndex),
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pace to {goalTotal.toLocaleString()}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="fillCumulative" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} minTickGap={32} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={48} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="target"
                name="On-pace target"
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="4 4"
                fill="none"
              />
              <Area
                type="monotone"
                dataKey="cumulative"
                name="Your total"
                stroke="hsl(var(--primary))"
                fill="url(#fillCumulative)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
