import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, AlertTriangle, ArrowLeftRight, MapPin } from "lucide-react";
import type { Transfer } from "@shared/schema";

type StationStat = {
  stationId: number;
  stationName: string;
  count: number;
  kites: number;
  wings: number;
  boards: number;
  totalValue: number;
};

type DashboardStats = {
  totalEquipment: number;
  equipmentPerStation: StationStat[];
  needsAttention: number;
  inTransfer: number;
  inTransferBreakdown: { kites: number; wings: number; boards: number; totalValue: number };
};

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();

  const { data: stats, isLoading } = useQuery<DashboardStats>({
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
        <Skeleton className="h-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
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
      label: "Locations",
      value: stats?.equipmentPerStation?.length ?? 0,
      icon: MapPin,
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-500/10",
    },
  ];

  const stations = stats?.equipmentPerStation ?? [];
  const totalKites = stations.reduce((s, st) => s + st.kites, 0);
  const totalWings = stations.reduce((s, st) => s + st.wings, 0);
  const totalBoards = stations.reduce((s, st) => s + st.boards, 0);
  const totalValue = stations.reduce((s, st) => s + st.totalValue, 0);

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-dashboard-title">
          Welcome back, {user?.name}
        </h1>
        <p className="text-muted-foreground mt-1">
          {isAdmin ? "Overview of all stations" : "Your station overview"}
        </p>
      </div>

      {/* Fleet Overview — first visible section */}
      {stations.length > 0 && (
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-sm">Fleet Overview</h2>
              <div className="flex items-center gap-4 pr-1">
                <span className="w-14 flex items-center justify-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                  <KiteIcon className="h-3.5 w-3.5" /> Kites
                </span>
                <span className="w-14 flex items-center justify-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                  <WingIcon className="h-3.5 w-3.5" /> Wings
                </span>
                <span className="w-14 flex items-center justify-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                  <BoardIcon className="h-3.5 w-3.5" /> Boards
                </span>
                {isAdmin && (
                  <span className="w-20 text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                    Value
                  </span>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-3 space-y-0">
            {stations.map((st, idx) => (
              <div
                key={st.stationId}
                className={`flex items-center justify-between py-2 ${idx < stations.length - 1 ? "border-b border-border/50" : ""}`}
                data-testid={`row-station-fleet-${st.stationId}`}
              >
                <Link href={`/stations/${st.stationId}`}>
                  <span
                    className="text-sm font-medium hover:text-primary transition-colors cursor-pointer truncate max-w-[140px] md:max-w-[200px]"
                    data-testid={`text-station-name-${st.stationId}`}
                  >
                    {st.stationName}
                  </span>
                </Link>
                <div className="flex items-center gap-4 shrink-0">
                  <StatPill value={st.kites} color="blue" />
                  <StatPill value={st.wings} color="emerald" />
                  <StatPill value={st.boards} color="amber" />
                  {isAdmin && (
                    <span className="w-20 text-right text-sm font-medium text-muted-foreground" data-testid={`text-value-${st.stationId}`}>
                      {st.totalValue > 0 ? `€${Math.round(st.totalValue).toLocaleString("de-DE")}` : "—"}
                    </span>
                  )}
                </div>
              </div>
            ))}

            {/* In Transfer row */}
            {stats?.inTransferBreakdown && stats.inTransfer > 0 && (
              <div className="flex items-center justify-between py-2 border-t border-dashed border-border/70">
                <span className="text-sm font-medium text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                  <ArrowLeftRight className="h-3.5 w-3.5" />
                  In Transfer
                </span>
                <div className="flex items-center gap-4 shrink-0">
                  <StatPill value={stats.inTransferBreakdown.kites} color="blue" muted />
                  <StatPill value={stats.inTransferBreakdown.wings} color="emerald" muted />
                  <StatPill value={stats.inTransferBreakdown.boards} color="amber" muted />
                  {isAdmin && (
                    <span className="w-20 text-right text-sm font-medium text-muted-foreground">
                      {stats.inTransferBreakdown.totalValue > 0
                        ? `€${Math.round(stats.inTransferBreakdown.totalValue).toLocaleString("de-DE")}`
                        : "—"}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Total row */}
            <div className="flex items-center justify-between pt-2.5 mt-1 border-t border-border">
              <span className="text-sm font-bold">Total</span>
              <div className="flex items-center gap-4 shrink-0">
                <StatPill value={totalKites} color="blue" bold />
                <StatPill value={totalWings} color="emerald" bold />
                <StatPill value={totalBoards} color="amber" bold />
                {isAdmin && (
                  <span className="w-20 text-right text-sm font-bold" data-testid="text-total-value">
                    {totalValue > 0 ? `€${Math.round(totalValue).toLocaleString("de-DE")}` : "—"}
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stat cards */}
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

      {/* Pending transfers */}
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

function StatPill({ value, color, bold, muted }: { value: number; color: "blue" | "emerald" | "amber"; bold?: boolean; muted?: boolean }) {
  const colorMap = {
    blue: muted ? "text-blue-600/70 dark:text-blue-400/70 bg-blue-50 dark:bg-blue-900/15" : "text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30",
    emerald: muted ? "text-emerald-600/70 dark:text-emerald-400/70 bg-emerald-50 dark:bg-emerald-900/15" : "text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/30",
    amber: muted ? "text-amber-600/70 dark:text-amber-400/70 bg-amber-50 dark:bg-amber-900/15" : "text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/30",
  };
  return (
    <span
      className={`w-14 text-center text-sm rounded-md py-0.5 ${bold ? "font-bold" : "font-medium"} ${value > 0 ? colorMap[color] : "text-muted-foreground/40 bg-transparent"}`}
    >
      {value > 0 ? value : "—"}
    </span>
  );
}

function KiteIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 3C7.5 3 3 7 3 12c0 1.5 0.4 2.5 1 3.2C5.5 16.3 8.5 16 12 16s6.5 0.3 8-0.8c0.6-0.7 1-1.7 1-3.2C21 7 16.5 3 12 3z" />
    </svg>
  );
}

function WingIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 4L2 15l10-3.5L22 15Z" />
    </svg>
  );
}

function BoardIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <rect x="2" y="9" width="20" height="6" rx="3" />
    </svg>
  );
}
