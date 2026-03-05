import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, AlertTriangle, ArrowLeftRight, MapPin } from "lucide-react";
import type { Transfer, Station, Equipment } from "@shared/schema";
import { EQUIPMENT_TYPE_LABELS } from "@shared/schema";

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
  inTransferBreakdown: { kites: number; wings: number; boards: number; totalValue: number; byType: Record<string, number> };
};

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard"],
    staleTime: 0,
  });

  const { data: pendingTransfers } = useQuery<Transfer[]>({
    queryKey: ["/api/transfers", "?status=pending"],
    staleTime: 0,
    queryFn: async () => {
      const res = await fetch("/api/transfers?status=pending", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const { data: stationsList } = useQuery<Station[]>({ queryKey: ["/api/stations"] });
  const { data: allEquipment } = useQuery<Equipment[]>({
    queryKey: ["/api/equipment"],
    queryFn: async () => {
      const res = await fetch("/api/equipment", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const getStationName = (id: number) =>
    stationsList?.find((s) => s.id === id)?.name ?? `Station ${id}`;
  const getEquipmentLabel = (id: number) => {
    const e = allEquipment?.find((eq) => eq.id === id);
    return e ? `${e.brand} ${e.model}` : `Equipment #${id}`;
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: "Equipment",
      value: stats?.totalEquipment ?? 0,
      icon: Package,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Attention",
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
  const itb = stats?.inTransferBreakdown;
  const totalKites = stations.reduce((s, st) => s + st.kites, 0) + (itb?.kites ?? 0);
  const totalWings = stations.reduce((s, st) => s + st.wings, 0) + (itb?.wings ?? 0);
  const totalBoards = stations.reduce((s, st) => s + st.boards, 0) + (itb?.boards ?? 0);
  const totalValue = stations.reduce((s, st) => s + st.totalValue, 0) + (itb?.totalValue ?? 0);

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-dashboard-title">
          Welcome back, {user?.name}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {isAdmin ? "Overview of all stations" : "Your station overview"}
        </p>
      </div>

      {/* Stat cards — now first, simpler labels */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide leading-tight">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold mt-0.5" data-testid={`text-stat-${stat.label.toLowerCase().replace(/\s/g, "-")}`}>
                    {stat.value}
                  </p>
                </div>
                <div className={`p-2 rounded-lg shrink-0 ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Fleet Overview */}
      {stations.length > 0 && (
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            {/* Header row — must match data row layout exactly */}
            <div className="flex items-center">
              <span className="flex-1 min-w-0 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Fleet Overview
              </span>
              <div className="flex items-center shrink-0" style={{ gap: "6px" }}>
                <ColHeader color="blue">
                  <KiteIcon className="h-3 w-3" /> Kites
                </ColHeader>
                <ColHeader color="emerald">
                  <WingIcon className="h-3 w-3" /> Wings
                </ColHeader>
                <ColHeader color="amber">
                  <BoardIcon className="h-3 w-3" /> Boards
                </ColHeader>
                {isAdmin && (
                  <span className="w-[62px] text-right text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
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
                className={`flex items-center py-2 ${idx < stations.length - 1 ? "border-b border-border/50" : ""}`}
                data-testid={`row-station-fleet-${st.stationId}`}
              >
                <Link href={st.stationId === 0 ? `/equipment?stationId=unassigned` : `/stations/${st.stationId}`} className="flex-1 min-w-0 pr-2">
                  <span
                    className={`text-sm font-medium hover:text-primary transition-colors cursor-pointer block truncate ${st.stationId === 0 ? "text-orange-600 dark:text-orange-400" : ""}`}
                    data-testid={`text-station-name-${st.stationId}`}
                  >
                    {st.stationName}
                    {st.stationId === 0 && <span className="ml-1.5 text-[11px] bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-full px-1.5 py-0.5 font-semibold">{st.count}</span>}
                  </span>
                </Link>
                <div className="flex items-center shrink-0" style={{ gap: "6px" }}>
                  <StatPill value={st.kites} color="blue" />
                  <StatPill value={st.wings} color="emerald" />
                  <StatPill value={st.boards} color="amber" />
                  {isAdmin && (
                    <span className="w-[62px] text-right text-sm font-medium text-muted-foreground tabular-nums" data-testid={`text-value-${st.stationId}`}>
                      {st.totalValue > 0 ? `€${Math.round(st.totalValue).toLocaleString("de-DE")}` : "—"}
                    </span>
                  )}
                </div>
              </div>
            ))}

            {/* In Transfer row */}
            {stats?.inTransferBreakdown && stats.inTransfer > 0 && (
              <div className="flex items-center py-2 border-t border-dashed border-border/70">
                <div className="flex-1 min-w-0 pr-2">
                  <span className="text-sm font-medium text-purple-600 dark:text-purple-400 flex items-center gap-1">
                    <ArrowLeftRight className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">In Transfer</span>
                    <span className="text-[11px] bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full px-1.5 py-0.5 font-semibold shrink-0">
                      {stats.inTransfer}
                    </span>
                  </span>
                </div>
                <div className="flex items-center shrink-0" style={{ gap: "6px" }}>
                  <StatPill value={stats.inTransferBreakdown.kites} color="blue" muted />
                  <StatPill value={stats.inTransferBreakdown.wings} color="emerald" muted />
                  <StatPill value={stats.inTransferBreakdown.boards} color="amber" muted />
                  {isAdmin && (
                    <span className="w-[62px] text-right text-sm font-medium text-muted-foreground tabular-nums">
                      {stats.inTransferBreakdown.totalValue > 0
                        ? `€${Math.round(stats.inTransferBreakdown.totalValue).toLocaleString("de-DE")}`
                        : "—"}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Total row */}
            <div className="flex items-center pt-2.5 mt-1 border-t border-border">
              <span className="flex-1 min-w-0 text-sm font-bold">Total</span>
              <div className="flex items-center shrink-0" style={{ gap: "6px" }}>
                <StatPill value={totalKites} color="blue" bold />
                <StatPill value={totalWings} color="emerald" bold />
                <StatPill value={totalBoards} color="amber" bold />
                {isAdmin && (
                  <span className="w-[62px] text-right text-sm font-bold tabular-nums" data-testid="text-total-value">
                    {totalValue > 0 ? `€${Math.round(totalValue).toLocaleString("de-DE")}` : "—"}
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending transfers */}
      {pendingTransfers && pendingTransfers.length > 0 && (
        <Card>
          <CardHeader className="pb-3 pt-4">
            <h2 className="font-semibold flex items-center gap-2 text-sm">
              <ArrowLeftRight className="h-4 w-4 text-purple-500 shrink-0" />
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
                className="flex items-start justify-between gap-2 p-3 rounded-md bg-muted/50"
                data-testid={`card-transfer-${t.id}`}
              >
                <span className="text-sm min-w-0 line-clamp-2">
                  {getEquipmentLabel(t.equipmentId)} · {getStationName(t.fromStationId)} → {getStationName(t.toStationId)}
                </span>
                <span className="text-xs text-muted-foreground shrink-0 mt-0.5">
                  {t.initiatedAt ? new Date(t.initiatedAt).toLocaleDateString("de-DE") : ""}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ColHeader({ children, color }: { children: React.ReactNode; color: "blue" | "emerald" | "amber" }) {
  const colorMap = {
    blue: "text-blue-600 dark:text-blue-400",
    emerald: "text-emerald-600 dark:text-emerald-400",
    amber: "text-amber-600 dark:text-amber-400",
  };
  return (
    <span className={`w-10 flex items-center justify-center gap-0.5 text-[10px] font-bold uppercase tracking-wide ${colorMap[color]}`}>
      {children}
    </span>
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
      className={`w-10 text-center text-sm rounded-md py-0.5 ${bold ? "font-bold" : "font-medium"} ${value > 0 ? colorMap[color] : "text-muted-foreground/40 bg-transparent"}`}
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
