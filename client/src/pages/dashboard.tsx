import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, AlertTriangle, ArrowLeftRight, MapPin } from "lucide-react";
import type { Transfer } from "@shared/schema";

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();

  const { data: stats, isLoading } = useQuery<{
    totalEquipment: number;
    equipmentPerStation: { stationId: number; stationName: string; count: number }[];
    needsAttention: number;
    inTransfer: number;
  }>({
    queryKey: ["/api/dashboard"],
  });

  const { data: pendingTransfers } = useQuery<Transfer[]>({
    queryKey: ["/api/transfers", "?status=pending"],
    queryFn: async () => {
      const res = await fetch("/api/transfers?status=pending", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Equipment",
      value: stats?.totalEquipment ?? 0,
      icon: Package,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Needs Attention",
      value: stats?.needsAttention ?? 0,
      icon: AlertTriangle,
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-500/10",
    },
    {
      label: "In Transfer",
      value: stats?.inTransfer ?? 0,
      icon: ArrowLeftRight,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-500/10",
    },
    {
      label: "Stations",
      value: stats?.equipmentPerStation?.length ?? 0,
      icon: MapPin,
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-500/10",
    },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-dashboard-title">
          Welcome back, {user?.name}
        </h1>
        <p className="text-muted-foreground mt-1">
          {isAdmin ? "Overview of all stations" : "Your station overview"}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4 md:p-5">
              <div className="flex items-start justify-between gap-1">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {stat.label}
                  </p>
                  <p className="text-2xl md:text-3xl font-bold" data-testid={`text-stat-${stat.label.toLowerCase().replace(/\s/g, "-")}`}>
                    {stat.value}
                  </p>
                </div>
                <div className={`p-2 rounded-md ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 md:h-5 md:w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {isAdmin && stats?.equipmentPerStation && stats.equipmentPerStation.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <h2 className="font-semibold">Equipment by Station</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.equipmentPerStation.map((station) => (
              <div key={station.stationId} className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <Link href={`/stations/${station.stationId}`}>
                    <span
                      className="font-medium underline-offset-2 cursor-pointer"
                      data-testid={`text-station-name-${station.stationId}`}
                    >
                      {station.stationName}
                    </span>
                  </Link>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{
                        width: `${stats.totalEquipment > 0 ? (station.count / stats.totalEquipment) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground w-8 text-right">
                    {station.count}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {pendingTransfers && pendingTransfers.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <h2 className="font-semibold flex items-center gap-2">
              <ArrowLeftRight className="h-4 w-4 text-purple-500" />
              Pending Transfers
              <span className="text-xs bg-purple-500/10 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full font-medium">
                {pendingTransfers.length}
              </span>
            </h2>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingTransfers.slice(0, 5).map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between p-3 rounded-md bg-muted/50"
                data-testid={`card-transfer-${t.id}`}
              >
                <span className="text-sm">
                  Equipment #{t.equipmentId} : Station {t.fromStationId} → Station {t.toStationId}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t.initiatedAt ? new Date(t.initiatedAt).toLocaleDateString() : ""}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
