import { useQuery } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, AlertTriangle, ArrowLeftRight, MapPin, MessageSquarePlus, ClipboardCheck, ShoppingCart, Users, Calendar, Wind, Thermometer, Navigation, GraduationCap, Tag, LogIn, LogOut } from "lucide-react";
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
  const { user, isAdmin, isStationLead, isSimulating, simStationId, viewMode } = useAuth();
  const isStationLeadView = isSimulating && viewMode === "station_lead" && simStationId != null;
  const actualIsStationLead = isStationLead || isStationLeadView;
  const dashboardQuery = isStationLeadView ? `/api/dashboard?stationId=${simStationId}` : "/api/dashboard";

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard", isStationLeadView ? simStationId : null],
    queryFn: async () => {
      const res = await fetch(dashboardQuery, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    staleTime: 0,
  });

  const { data: allPendingTransfers } = useQuery<Transfer[]>({
    queryKey: ["/api/transfers", "?status=pending"],
    staleTime: 0,
    queryFn: async () => {
      const res = await fetch("/api/transfers?status=pending", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const pendingTransfers = isStationLeadView && simStationId != null
    ? allPendingTransfers?.filter((t) => t.fromStationId === simStationId || t.toStationId === simStationId)
    : allPendingTransfers;

  const { data: openFeedbackData } = useQuery<{ count: number }>({
    queryKey: ["/api/feedback/open-count"],
    staleTime: 0,
    enabled: isAdmin,
  });

  const { data: stationsList } = useQuery<Station[]>({ queryKey: ["/api/stations"] });

  const activeStationId = isStationLeadView ? simStationId : (user as any)?.assignedStationId;
  const { data: customersSummary } = useQuery<Array<{ date: string; course: number; rental: number; arrivals: number; departures: number }>>({
    queryKey: ["/api/dashboard/customers-summary", activeStationId],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard/customers-summary?stationId=${activeStationId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: actualIsStationLead && !!activeStationId,
    staleTime: 0,
  });
  const { data: allEquipment } = useQuery<Equipment[]>({
    queryKey: ["/api/equipment", isStationLeadView ? `?stationId=${simStationId}&includeTransfers=true` : ""],
    queryFn: async () => {
      const url = isStationLeadView
        ? `/api/equipment?stationId=${simStationId}&includeTransfers=true`
        : "/api/equipment";
      const res = await fetch(url, { credentials: "include" });
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
        {actualIsStationLead ? (
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-40" />)}
          </div>
        ) : (
          <>
            <Skeleton className="h-48" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
            </div>
          </>
        )}
      </div>
    );
  }

  // Station Lead (Center Manager) Dashboard — Large feature cards
  if (actualIsStationLead) {
    const featureCards = [
      {
        label: "Quick Inventory",
        href: "/quick-inventory",
        icon: ClipboardCheck,
        color: "text-blue-600 dark:text-blue-400",
        bgColor: "bg-blue-50 dark:bg-blue-950/30",
        borderColor: "border-blue-200 dark:border-blue-800",
        description: "Count & check equipment",
      },
      {
        label: "Equipment",
        href: "/equipment",
        icon: Package,
        color: "text-primary",
        bgColor: "bg-primary/10",
        borderColor: "border-primary/20",
        description: "Manage inventory",
      },
      {
        label: "Sales",
        href: "/sales",
        icon: ShoppingCart,
        color: "text-emerald-600 dark:text-emerald-400",
        bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
        borderColor: "border-emerald-200 dark:border-emerald-800",
        description: "Process rentals & sales",
      },
      {
        label: "Customers",
        href: "/customers",
        icon: Users,
        color: "text-purple-600 dark:text-purple-400",
        bgColor: "bg-purple-50 dark:bg-purple-950/30",
        borderColor: "border-purple-200 dark:border-purple-800",
        description: "Manage contacts",
      },
    ];

    return (
      <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight" data-testid="text-dashboard-title">
            Welcome, {user?.name}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {isStationLeadView
              ? `${stationsList?.find(s => s.id === simStationId)?.name ?? "..."} · Station Overview`
              : "Your station overview"}
          </p>
        </div>

        {/* Weather widget */}
        <WeatherWidget stationName={
          isStationLeadView
            ? stationsList?.find(s => s.id === simStationId)?.name ?? ""
            : stationsList?.find(s => s.id === (user as any)?.assignedStationId)?.name ?? ""
        } />

        {/* Customer overview card */}
        <Link href="/customers">
          <Card className="cursor-pointer border-purple-200 dark:border-purple-800 hover:shadow-md transition-all">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-4 w-4 text-purple-500 shrink-0" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Guests on site</span>
              </div>

              {!customersSummary || !Array.isArray(customersSummary) ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-9 w-full rounded-lg" />)}
                </div>
              ) : (
                <div>
                  {/* Column headers with icons */}
                  <div className="grid items-center px-3 mb-1" style={{ gridTemplateColumns: "1fr 2.2rem 2.2rem 2.2rem 2.2rem" }}>
                    <span />
                    <div className="flex flex-col items-center gap-0.5">
                      <GraduationCap className="h-3 w-3 text-purple-400" />
                      <span className="text-[9px] text-purple-400 leading-none">Crs</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      <Tag className="h-3 w-3 text-slate-400" />
                      <span className="text-[9px] text-slate-400 leading-none">Rnt</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      <LogIn className="h-3 w-3 text-emerald-500" />
                      <span className="text-[9px] text-emerald-500 leading-none">Arr</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      <LogOut className="h-3 w-3 text-amber-500" />
                      <span className="text-[9px] text-amber-500 leading-none">Dep</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    {customersSummary.map((row, i) => {
                      const d = new Date(row.date + "T12:00:00");
                      const isToday = i === 0;
                      const isTomorrow = i === 1;
                      const label = isToday
                        ? "Today"
                        : isTomorrow
                        ? "Tomorrow"
                        : d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });

                      return (
                        <div
                          key={row.date}
                          className={`grid items-center px-3 py-2 rounded-xl ${
                            isToday ? "bg-purple-600" : "bg-slate-50 dark:bg-slate-800/40"
                          }`}
                          style={{ gridTemplateColumns: "1fr 2.2rem 2.2rem 2.2rem 2.2rem" }}
                        >
                          <span className={`text-sm font-semibold ${isToday ? "text-white" : "text-foreground"}`}>
                            {label}
                          </span>
                          <span className={`text-base font-bold text-center ${isToday ? "text-white" : "text-purple-600 dark:text-purple-400"}`} data-testid={`text-customers-course-${i}`}>
                            {row.course}
                          </span>
                          <span className={`text-base font-bold text-center ${isToday ? "text-purple-200" : "text-slate-400"}`} data-testid={`text-customers-rental-${i}`}>
                            {row.rental}
                          </span>
                          <span className={`text-base font-bold text-center ${isToday ? "text-emerald-200" : "text-emerald-600 dark:text-emerald-400"}`} data-testid={`text-customers-arrivals-${i}`}>
                            {row.arrivals}
                          </span>
                          <span className={`text-base font-bold text-center ${isToday ? "text-amber-200" : "text-amber-500 dark:text-amber-400"}`} data-testid={`text-customers-departures-${i}`}>
                            {row.departures}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                </div>
              )}
            </CardContent>
          </Card>
        </Link>

        {/* Large feature cards */}
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          {featureCards.map((card) => (
            <Link key={card.href} href={card.href}>
              <Card className={`cursor-pointer border-2 ${card.borderColor} transition-all hover:shadow-md`}>
                <CardContent className="p-4 md:p-6 flex flex-col items-center justify-center gap-3 h-40 md:h-48">
                  <div className={`p-3 md:p-4 rounded-lg ${card.bgColor}`}>
                    <card.icon className={`h-8 w-8 md:h-10 md:w-10 ${card.color}`} />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-sm md:text-base" data-testid={`text-feature-${card.label.toLowerCase().replace(/\s/g, "-")}`}>
                      {card.label}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {card.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
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
          {isStationLeadView
            ? `Station overview — ${stationsList?.find(s => s.id === simStationId)?.name ?? "..."}`
            : isAdmin
              ? "Overview of all stations"
              : "Your station overview"}
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

      {isAdmin && (openFeedbackData?.count ?? 0) > 0 && (
        <Link href="/feedback">
          <Card className="border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20 cursor-pointer hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-colors">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10 shrink-0">
                <MessageSquarePlus className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" data-testid="text-feedback-alert">
                  {openFeedbackData!.count} open feedback {openFeedbackData!.count === 1 ? "item" : "items"}
                </p>
                <p className="text-xs text-muted-foreground">New reports from your team</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      )}

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

// Coordinates for known kite school stations
const STATION_COORDS: Record<string, { lat: number; lon: number; label: string; timezone: string }> = {
  dakhla:    { lat: 23.72,  lon: -15.93, label: "Dakhla",    timezone: "Africa/Casablanca" },
  tatajuba:  { lat: -2.77,  lon: -40.39, label: "Tatajuba",  timezone: "America/Fortaleza" },
  hamburg:   { lat: 53.55,  lon:   9.99, label: "Hamburg",   timezone: "Europe/Berlin" },
  heidenau:  { lat: 53.47,  lon:  10.11, label: "Heidenau",  timezone: "Europe/Berlin" },
};

function getStationCoords(name: string) {
  const lower = name.toLowerCase();
  for (const [key, val] of Object.entries(STATION_COORDS)) {
    if (lower.includes(key)) return val;
  }
  return null;
}

function degToCompass(deg: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(deg / 45) % 8];
}

function wmoToDescription(code: number): string {
  if (code === 0) return "Clear sky";
  if (code <= 3) return "Partly cloudy";
  if (code <= 48) return "Foggy";
  if (code <= 57) return "Drizzle";
  if (code <= 67) return "Rain";
  if (code <= 77) return "Snow";
  if (code <= 82) return "Rain showers";
  if (code <= 99) return "Thunderstorm";
  return "Unknown";
}

function kiteRating(knots: number): { label: string; color: string } {
  if (knots < 8)  return { label: "Too light", color: "text-muted-foreground" };
  if (knots < 12) return { label: "Light", color: "text-yellow-600 dark:text-yellow-400" };
  if (knots < 20) return { label: "Good", color: "text-emerald-600 dark:text-emerald-400" };
  if (knots < 30) return { label: "Strong", color: "text-blue-600 dark:text-blue-400" };
  return { label: "Storm", color: "text-red-600 dark:text-red-400" };
}

type WeatherData = {
  current: {
    time: string;
    temperature_2m: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    weather_code: number;
  };
  hourly: {
    time: string[];
    wind_speed_10m: number[];
    wind_direction_10m: number[];
    temperature_2m: number[];
    weather_code: number[];
  };
  daily: {
    time: string[];
    sunrise: string[];
    sunset: string[];
  };
};

function windBarColor(knots: number): string {
  if (knots < 8)  return "bg-slate-300 dark:bg-slate-600";
  if (knots < 12) return "bg-yellow-400 dark:bg-yellow-500";
  if (knots < 20) return "bg-emerald-500 dark:bg-emerald-400";
  if (knots < 28) return "bg-blue-500 dark:bg-blue-400";
  return "bg-red-500 dark:bg-red-400";
}

function windTextColor(knots: number): string {
  if (knots < 8)  return "text-slate-400 dark:text-slate-500";
  if (knots < 12) return "text-yellow-600 dark:text-yellow-400";
  if (knots < 20) return "text-emerald-600 dark:text-emerald-400";
  if (knots < 28) return "text-blue-600 dark:text-blue-400";
  return "text-red-600 dark:text-red-400";
}

function WindBarCard({
  time, wind, direction, temp, isCurrent, isNow,
}: {
  time: string; wind: number; direction: number; temp: number; isCurrent: boolean; isNow: boolean;
}) {
  const maxBar = 35;
  const barHeightPct = Math.min(100, (wind / maxBar) * 100);
  const hour = new Date(time).getHours();
  const label = `${String(hour).padStart(2, "0")}h`;
  const dir = degToCompass(direction);

  return (
    <div className={`flex flex-col items-center gap-0 min-w-[26px]`}>
      <span className={`text-[8px] font-medium leading-tight ${isNow ? "text-sky-600 dark:text-sky-400 font-bold" : "text-muted-foreground"}`}>
        {isNow ? "Now" : label}
      </span>
      <div className={`text-[7px] font-medium leading-tight ${windTextColor(wind)}`}>{dir}</div>
      <div className="relative h-10 w-4 flex items-end justify-center">
        <div
          className={`w-3 rounded-t-sm transition-all ${windBarColor(wind)} ${isCurrent ? "ring-1 ring-offset-1 ring-sky-400" : ""}`}
          style={{ height: `${Math.max(8, barHeightPct)}%` }}
        />
      </div>
      <span className={`text-[9px] font-bold tabular-nums leading-tight ${windTextColor(wind)}`}>{Math.round(wind)}</span>
      <span className="text-[7px] text-muted-foreground leading-tight">{Math.round(temp)}°</span>
    </div>
  );
}

function WeatherWidget({ stationName }: { stationName: string }) {
  const coords = getStationCoords(stationName);
  const [activeDay, setActiveDay] = useState<0 | 1>(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const nowCardRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isError } = useQuery<WeatherData>({
    queryKey: ["weather-hourly", coords?.lat, coords?.lon],
    queryFn: async () => {
      if (!coords) throw new Error("No coords");
      const url = [
        `https://api.open-meteo.com/v1/forecast`,
        `?latitude=${coords.lat}&longitude=${coords.lon}`,
        `&current=temperature_2m,wind_speed_10m,wind_direction_10m,weather_code`,
        `&hourly=wind_speed_10m,wind_direction_10m,temperature_2m,weather_code`,
        `&daily=sunrise,sunset`,
        `&wind_speed_unit=kn`,
        `&timezone=${encodeURIComponent(coords.timezone)}`,
        `&forecast_days=2`,
      ].join("");
      const res = await fetch(url);
      if (!res.ok) throw new Error("Weather fetch failed");
      return res.json();
    },
    enabled: !!coords,
    staleTime: 15 * 60 * 1000,
    retry: 1,
  });

  useEffect(() => {
    if (activeDay === 0 && nowCardRef.current && scrollRef.current) {
      setTimeout(() => {
        nowCardRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }, 100);
    } else if (scrollRef.current) {
      scrollRef.current.scrollLeft = 0;
    }
  }, [activeDay, data]);

  if (!coords) return null;

  if (isLoading) {
    return <Skeleton className="h-56 w-full rounded-xl" />;
  }

  if (isError || !data) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-4 text-center text-xs text-muted-foreground">
          Weather data unavailable
        </CardContent>
      </Card>
    );
  }

  const currentWind = Math.round(data.current.wind_speed_10m);
  const currentDir = degToCompass(data.current.wind_direction_10m);
  const currentTemp = Math.round(data.current.temperature_2m);
  const currentRating = kiteRating(currentWind);
  const currentDesc = wmoToDescription(data.current.weather_code);
  const nowTime = data.current.time;

  const sunrise = data.daily.sunrise[activeDay];
  const sunset = data.daily.sunset[activeDay];
  const dayLabel = activeDay === 0 ? "Today" : "Tomorrow";

  const sunriseDate = new Date(sunrise);
  const sunsetDate = new Date(sunset);

  const fmt = (iso: string) => {
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  const dayHours = data.hourly.time
    .map((t, i) => ({
      time: t,
      wind: data.hourly.wind_speed_10m[i],
      direction: data.hourly.wind_direction_10m[i],
      temp: data.hourly.temperature_2m[i],
      wmo: data.hourly.weather_code[i],
    }))
    .filter(({ time }) => {
      const d = new Date(time);
      return d >= sunriseDate && d <= sunsetDate;
    });

  const nowHourStr = nowTime.substring(0, 13);
  const nowHourNum = parseInt(nowHourStr.substring(11, 13), 10);
  const nowIdx = activeDay === 0
    ? dayHours.reduce((best, h, i) => {
        const hNum = parseInt(h.time.substring(11, 13), 10);
        const bestNum = best >= 0 ? parseInt(dayHours[best].time.substring(11, 13), 10) : 99;
        return Math.abs(hNum - nowHourNum) < Math.abs(bestNum - nowHourNum) ? i : best;
      }, -1)
    : -1;

  const peakHour = [...dayHours].sort((a, b) => b.wind - a.wind)[0];
  const goodHours = dayHours.filter(h => h.wind >= 12 && h.wind < 28);

  return (
    <Card className="border-sky-200 dark:border-sky-800 overflow-hidden">
      <CardContent className="p-0">
        {/* Compact header row: station + conditions + tabs */}
        <div className="flex items-center border-b border-border px-3 py-2 gap-2">
          <Wind className="h-3 w-3 text-sky-500 shrink-0" />
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide shrink-0">
            {coords.label}
          </span>
          {activeDay === 0 ? (
            <div className="flex items-center gap-1.5 ml-1 min-w-0">
              <span className={`text-xs font-bold tabular-nums ${windTextColor(currentWind)}`} data-testid="text-wind-speed">
                {currentWind} kn
              </span>
              <Navigation
                className="h-3 w-3 text-sky-500 shrink-0"
                style={{ transform: `rotate(${data.current.wind_direction_10m}deg)` }}
              />
              <span className="text-[10px] font-semibold text-sky-600 dark:text-sky-400">{currentDir}</span>
              <Thermometer className="h-3 w-3 text-orange-400" />
              <span className="text-[10px] font-medium">{currentTemp}°</span>
              <span className={`text-[10px] font-semibold ${currentRating.color}`} data-testid="text-kite-rating">
                · {currentRating.label}
              </span>
            </div>
          ) : peakHour ? (
            <div className="flex items-center gap-1.5 ml-1 min-w-0">
              <span className="text-[9px] text-muted-foreground shrink-0">peak</span>
              <span className={`text-xs font-bold tabular-nums ${windTextColor(Math.round(peakHour.wind))}`}>
                {Math.round(peakHour.wind)} kn
              </span>
              <Navigation
                className="h-3 w-3 text-sky-500 shrink-0"
                style={{ transform: `rotate(${peakHour.direction}deg)` }}
              />
              <span className="text-[10px] font-semibold text-sky-600 dark:text-sky-400">{degToCompass(peakHour.direction)}</span>
              <Thermometer className="h-3 w-3 text-orange-400" />
              <span className="text-[10px] font-medium">{Math.round(peakHour.temp)}°</span>
              <span className={`text-[10px] font-semibold ${kiteRating(Math.round(peakHour.wind)).color}`}>
                · {kiteRating(Math.round(peakHour.wind)).label}
              </span>
            </div>
          ) : null}
          <div className="flex ml-auto shrink-0">
            {(["Today", "Tomorrow"] as const).map((label, i) => (
              <button
                key={label}
                onClick={() => setActiveDay(i as 0 | 1)}
                className={`px-2.5 py-0.5 text-[10px] font-semibold rounded-full transition-colors ${
                  activeDay === i
                    ? "bg-sky-500 text-white"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                data-testid={`button-weather-${label.toLowerCase()}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Sunrise / sunset + best window */}
        <div className="grid grid-cols-3 items-center px-3 py-1 text-[9px] text-muted-foreground bg-amber-50/40 dark:bg-amber-950/10 border-b border-border">
          <span>🌅 {fmt(sunrise)}</span>
          <span className="font-medium text-amber-700 dark:text-amber-400 text-center leading-tight">
            {goodHours.length > 0
              ? `Best: ${fmt(goodHours[0].time)}–${fmt(goodHours[goodHours.length - 1].time)}`
              : peakHour ? `Peak ${Math.round(peakHour.wind)} kn @ ${fmt(peakHour.time)}` : "No kite window"}
          </span>
          <span className="text-right">🌇 {fmt(sunset)}</span>
        </div>

        {/* 2-hour wind chart */}
        <div
          ref={scrollRef}
          className="overflow-x-auto flex gap-0.5 px-2 py-2 justify-center"
          style={{ scrollbarWidth: "none" }}
        >
          {dayHours.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 w-full text-center">No data for this day</p>
          ) : (
            dayHours.map((h, idx) => {
              const isNow = idx === nowIdx;
              return (
                <div key={h.time} ref={isNow ? nowCardRef : undefined}>
                  <WindBarCard
                    time={h.time}
                    wind={h.wind}
                    direction={h.direction}
                    temp={h.temp}
                    isCurrent={isNow}
                    isNow={isNow}
                  />
                </div>
              );
            })
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-2 px-3 pb-2 border-t border-border pt-1.5">
          {[
            { color: "bg-slate-300 dark:bg-slate-600", label: "<8" },
            { color: "bg-yellow-400", label: "8–12" },
            { color: "bg-emerald-500", label: "12–20✓" },
            { color: "bg-blue-500", label: "20–28✓" },
            { color: "bg-red-500", label: ">28⚠" },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-0.5">
              <div className={`w-2 h-2 rounded-sm ${color}`} />
              <span className="text-[8px] text-muted-foreground">{label}</span>
            </div>
          ))}
          <span className="text-[8px] text-muted-foreground">kn</span>
        </div>
      </CardContent>
    </Card>
  );
}

