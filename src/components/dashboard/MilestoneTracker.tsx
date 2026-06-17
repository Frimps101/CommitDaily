import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function MilestoneTracker({
  all,
  total,
}: {
  all: number[];
  total: number;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Milestones</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          {all.map((m) => {
            const reached = total >= m;
            return (
              <div
                key={m}
                className={cn(
                  "flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm",
                  reached
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border text-muted-foreground",
                )}
              >
                {reached ? <Check className="h-3.5 w-3.5" /> : null}
                {m.toLocaleString()}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
