"use client";

import CalendarHeatmap from "react-calendar-heatmap";
import "react-calendar-heatmap/dist/styles.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Day = { date: string; count: number };

function classForCount(count: number): string {
  if (!count) return "color-empty";
  if (count >= 10) return "color-scale-4";
  if (count >= 6) return "color-scale-3";
  if (count >= 3) return "color-scale-2";
  return "color-scale-1";
}

export function Heatmap({
  days,
  year,
}: {
  days: Day[];
  year: number;
}) {
  const start = `${year - 1}-12-31`;
  const end = `${year}-12-31`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contribution graph</CardTitle>
      </CardHeader>
      <CardContent>
        <CalendarHeatmap
          startDate={new Date(start)}
          endDate={new Date(end)}
          values={days}
          classForValue={(v) => classForCount((v as Day | null)?.count ?? 0)}
          titleForValue={(v) => {
            const day = v as Day | null;
            if (!day) return "No data";
            return `${day.date}: ${day.count} contribution${day.count === 1 ? "" : "s"}`;
          }}
          showWeekdayLabels
        />
        <div className="mt-3 flex items-center justify-end gap-1 text-xs text-muted-foreground">
          <span>Less</span>
          <span className="inline-block h-3 w-3 rounded-sm bg-muted" />
          <span className="inline-block h-3 w-3 rounded-sm" style={{ background: "#0e4429" }} />
          <span className="inline-block h-3 w-3 rounded-sm" style={{ background: "#006d32" }} />
          <span className="inline-block h-3 w-3 rounded-sm" style={{ background: "#26a641" }} />
          <span className="inline-block h-3 w-3 rounded-sm" style={{ background: "#39d353" }} />
          <span>More</span>
        </div>
      </CardContent>
    </Card>
  );
}
