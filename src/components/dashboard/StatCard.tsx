import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  accent?: "default" | "primary" | "warning" | "danger";
}) {
  const accentClass =
    accent === "primary"
      ? "text-primary"
      : accent === "warning"
        ? "text-amber-400"
        : accent === "danger"
          ? "text-destructive"
          : "text-foreground";

  return (
    <Card>
      <CardContent className="p-5">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
        <div className={cn("mt-2 text-3xl font-bold tabular-nums", accentClass)}>
          {value}
        </div>
        {hint ? (
          <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
        ) : null}
      </CardContent>
    </Card>
  );
}
