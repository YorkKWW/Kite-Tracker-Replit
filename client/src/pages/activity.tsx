import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Package, Star, Wrench, ArrowLeftRight, UserPlus, MapPin } from "lucide-react";
import type { ActivityLog } from "@shared/schema";

const actionIcons: Record<string, React.ReactNode> = {
  equipment_created: <Package className="h-4 w-4 text-primary" />,
  equipment_deleted: <Package className="h-4 w-4 text-destructive" />,
  condition_rated: <Star className="h-4 w-4 text-yellow-500" />,
  repair_logged: <Wrench className="h-4 w-4 text-orange-500" />,
  transfer_initiated: <ArrowLeftRight className="h-4 w-4 text-purple-500" />,
  transfer_confirmed: <ArrowLeftRight className="h-4 w-4 text-green-500" />,
  user_created: <UserPlus className="h-4 w-4 text-blue-500" />,
  station_created: <MapPin className="h-4 w-4 text-emerald-500" />,
  system_seeded: <FileText className="h-4 w-4 text-muted-foreground" />,
};

export default function ActivityPage() {
  const { data: logs, isLoading } = useQuery<ActivityLog[]>({
    queryKey: ["/api/activity"],
  });

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-4 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-32" />
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16" />)}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold tracking-tight" data-testid="text-activity-title">
        Activity Log
      </h1>

      {!logs?.length ? (
        <div className="text-center py-16">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="font-medium">No activity yet</h3>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <Card key={log.id} data-testid={`card-activity-${log.id}`}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className="p-2 rounded-md bg-muted/50">
                  {actionIcons[log.action] || <FileText className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{log.details || log.action}</p>
                  <p className="text-xs text-muted-foreground">
                    User #{log.userId} &middot; {log.timestamp ? new Date(log.timestamp).toLocaleString() : ""}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
