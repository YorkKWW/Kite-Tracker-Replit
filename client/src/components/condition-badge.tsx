import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const conditionConfig: Record<number, { label: string; className: string }> = {
  1: { label: "1 - Trash", className: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/20" },
  2: { label: "2 - Poor", className: "bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/20" },
  3: { label: "3 - Fair", className: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/20" },
  4: { label: "4 - Good", className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20" },
  5: { label: "5 - New", className: "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/20" },
};

export function ConditionBadge({ rating, compact }: { rating: number; compact?: boolean }) {
  const config = conditionConfig[rating] || conditionConfig[3];
  return (
    <Badge
      variant="outline"
      className={cn("no-default-hover-elevate no-default-active-elevate font-medium", config.className)}
      data-testid={`badge-condition-${rating}`}
    >
      {compact ? rating : config.label}
    </Badge>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const config: Record<string, string> = {
    active: "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/20",
    in_repair: "bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/20",
    retired: "bg-muted text-muted-foreground border-border",
    sold: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/20",
    in_transfer: "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/20",
  };

  const labels: Record<string, string> = {
    active: "Active",
    in_repair: "In Repair",
    retired: "Retired",
    sold: "Sold",
    in_transfer: "In Transfer",
  };

  return (
    <Badge
      variant="outline"
      className={cn("no-default-hover-elevate no-default-active-elevate font-medium", config[status] || "")}
      data-testid={`badge-status-${status}`}
    >
      {labels[status] || status}
    </Badge>
  );
}
