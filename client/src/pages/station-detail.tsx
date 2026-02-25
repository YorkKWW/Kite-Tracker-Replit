import { useState } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Package, Wrench, ArrowLeftRight, Wind,
  ChevronDown, ChevronUp, Layers, Link2, Shirt, Shield,
  Star, MapPin, ClipboardCheck, ClipboardList, Loader2,
} from "lucide-react";
import type { Equipment, Station, InventoryCheck } from "@shared/schema";
import { EQUIPMENT_TYPE_LABELS } from "@shared/schema";
import { cn } from "@/lib/utils";

// ─── Condition helpers ────────────────────────────────────────────
const CONDITION_COLORS = {
  5: { bg: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-400", badge: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20" },
  4: { bg: "bg-green-400",   text: "text-green-700 dark:text-green-400",     badge: "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/20" },
  3: { bg: "bg-yellow-400",  text: "text-yellow-700 dark:text-yellow-400",   badge: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/20" },
  2: { bg: "bg-orange-400",  text: "text-orange-700 dark:text-orange-400",   badge: "bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/20" },
  1: { bg: "bg-red-500",     text: "text-red-700 dark:text-red-400",         badge: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/20" },
} as const;

function avgCondition(items: Equipment[]) {
  if (!items.length) return 0;
  return items.reduce((s, i) => s + i.conditionRating, 0) / items.length;
}

function conditionColor(avg: number) {
  if (avg >= 4.5) return CONDITION_COLORS[5];
  if (avg >= 3.5) return CONDITION_COLORS[4];
  if (avg >= 2.5) return CONDITION_COLORS[3];
  if (avg >= 1.5) return CONDITION_COLORS[2];
  return CONDITION_COLORS[1];
}

// ─── Condition distribution bar ──────────────────────────────────
function ConditionBar({ items }: { items: Equipment[] }) {
  if (!items.length) return null;
  const buckets = [5, 4, 3, 2, 1] as const;
  const counts = buckets.map((r) => items.filter((i) => i.conditionRating === r).length);
  return (
    <div className="flex h-2 rounded-full overflow-hidden gap-px w-full">
      {buckets.map((r, idx) => {
        const pct = (counts[idx] / items.length) * 100;
        if (pct === 0) return null;
        return (
          <div
            key={r}
            className={cn("h-full transition-all", CONDITION_COLORS[r].bg)}
            style={{ width: `${pct}%` }}
            title={`${r}★: ${counts[idx]}`}
          />
        );
      })}
    </div>
  );
}

// ─── Size / attribute tag cluster ────────────────────────────────
function SizeCluster({
  items,
  getKey,
  unit,
}: {
  items: Equipment[];
  getKey: (i: Equipment) => string | null;
  unit?: string;
}) {
  const groups: Record<string, Equipment[]> = {};
  items.forEach((i) => {
    const k = getKey(i) ?? "N/A";
    (groups[k] = groups[k] || []).push(i);
  });

  const sorted = Object.entries(groups).sort(([a], [b]) => {
    const na = parseFloat(a), nb = parseFloat(b);
    return isNaN(na) || isNaN(nb) ? a.localeCompare(b) : na - nb;
  });

  return (
    <div className="flex flex-wrap gap-1.5">
      {sorted.map(([key, grpItems]) => {
        const avg = avgCondition(grpItems);
        const col = conditionColor(avg);
        return (
          <span
            key={key}
            className={cn(
              "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border",
              col.badge
            )}
            title={`Avg condition: ${avg.toFixed(1)}`}
          >
            {key}{unit && key !== "N/A" ? unit : ""}
            <span className="opacity-70">×{grpItems.length}</span>
          </span>
        );
      })}
    </div>
  );
}

// ─── Category card ────────────────────────────────────────────────
interface CategoryCardProps {
  icon: React.ReactNode;
  title: string;
  items: Equipment[];
  renderContent: () => React.ReactNode;
  stationId: number;
  typeFilter?: string;
}

function CategoryCard({ icon, title, items, renderContent, stationId, typeFilter }: CategoryCardProps) {
  const [expanded, setExpanded] = useState(true);
  if (!items.length) return null;

  const avg = avgCondition(items);
  const col = conditionColor(avg);

  return (
    <Card>
      <button
        className="w-full text-left"
        onClick={() => setExpanded((v) => !v)}
        data-testid={`button-expand-${title.toLowerCase().replace(/\s/g, "-")}`}
      >
        <CardHeader className="pb-2 flex flex-row items-center justify-between gap-1">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-md bg-primary/10 text-primary shrink-0">
              {icon}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold">{title}</h3>
                <Badge
                  variant="secondary"
                  className="no-default-hover-elevate no-default-active-elevate text-[10px] font-bold"
                >
                  {items.length}
                </Badge>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className={cn("text-xs font-medium", col.text)}>
                  ★ {avg.toFixed(1)} avg
                </span>
                <div className="flex-1 min-w-[80px]">
                  <ConditionBar items={items} />
                </div>
              </div>
            </div>
          </div>
          <div className="shrink-0">
            {expanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </CardHeader>
      </button>

      {expanded && (
        <CardContent className="pt-0 space-y-4">
          <div>{renderContent()}</div>
          <Link
            href={`/equipment?stationId=${stationId}${typeFilter ? `&type=${typeFilter}` : ""}`}
          >
            <Button variant="ghost" size="sm" className="text-xs h-7 px-2 text-muted-foreground">
              View all {title} →
            </Button>
          </Link>
        </CardContent>
      )}
    </Card>
  );
}

// ─── "Other" grouped by sub-type ─────────────────────────────────
function OtherCategory({ items, stationId }: { items: Equipment[]; stationId: number }) {
  const byType: Record<string, Equipment[]> = {};
  items.forEach((i) => {
    const label = EQUIPMENT_TYPE_LABELS[i.type] || i.type;
    (byType[label] = byType[label] || []).push(i);
  });

  return (
    <CategoryCard
      icon={<Shield className="h-4 w-4" />}
      title="Other Gear"
      items={items}
      stationId={stationId}
      renderContent={() => (
        <div className="space-y-3">
          {Object.entries(byType).map(([type, grpItems]) => {
            const avg = avgCondition(grpItems);
            const col = conditionColor(avg);
            return (
              <div key={type} className="space-y-1.5">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-sm font-medium">{type}</span>
                  <span className={cn("text-xs font-medium", col.text)}>
                    {grpItems.length} item{grpItems.length !== 1 ? "s" : ""} · ★{avg.toFixed(1)}
                  </span>
                </div>
                <ConditionBar items={grpItems} />
                {/* Sub-grouping by size/type attributes */}
                <SizeCluster
                  items={grpItems}
                  getKey={(i) => {
                    const f = (i.typeSpecificFields || {}) as Record<string, any>;
                    return f.size ?? f.harnessType ?? f.gearType ?? null;
                  }}
                />
              </div>
            );
          })}
        </div>
      )}
    />
  );
}

// ─── Main page ───────────────────────────────────────────────────
export default function StationDetailPage() {
  const [, params] = useRoute("/stations/:id");
  const [, navigate] = useLocation();
  const stationId = parseInt(params?.id || "0");
  const { isAdmin } = useAuth();
  const { toast } = useToast();

  const { data: stationsList, isLoading: loadingStations } = useQuery<Station[]>({
    queryKey: ["/api/stations"],
  });

  const { data: allEquipment, isLoading: loadingEquipment } = useQuery<Equipment[]>({
    queryKey: ["/api/equipment", `?stationId=${stationId}`],
    queryFn: async () => {
      const res = await fetch(`/api/equipment?stationId=${stationId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const { data: pastChecks } = useQuery<InventoryCheck[]>({
    queryKey: ["/api/stations", stationId.toString(), "inventory-checks"],
    queryFn: async () => {
      const res = await fetch(`/api/stations/${stationId}/inventory-checks`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const startCheckMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/stations/${stationId}/inventory-checks`),
    onSuccess: async (res) => {
      const check = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/stations", stationId.toString(), "inventory-checks"] });
      navigate(`/inventory-check/${check.id}`);
    },
    onError: () => {
      toast({ title: "Failed to start inventory check", variant: "destructive" });
    },
  });

  const station = stationsList?.find((s) => s.id === stationId);
  const isLoading = loadingStations || loadingEquipment;

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-8 w-40" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40" />)}
      </div>
    );
  }

  if (!station || !allEquipment) {
    return (
      <div className="p-4 md:p-6 text-center py-16">
        <p className="text-muted-foreground">Station not found</p>
        <Link href={isAdmin ? "/stations" : "/"}>
          <Button variant="secondary" className="mt-4">Go back</Button>
        </Link>
      </div>
    );
  }

  // ─── Data slices ───────────────────────────────────────────────
  const kites      = allEquipment.filter((e) => e.type === "kite");
  const wings      = allEquipment.filter((e) => e.type === "wing");
  const boards     = allEquipment.filter((e) => e.type === "board");
  const foilboards = allEquipment.filter((e) => e.type === "foilboard");
  const barsLines  = allEquipment.filter((e) => e.type === "bar_lines");
  const foils      = allEquipment.filter((e) => e.type === "foil");
  const other      = allEquipment.filter((e) =>
    ["wetsuit", "harness", "helmet_safety", "foil"].includes(e.type)
  );

  const avgCond      = avgCondition(allEquipment);
  const avgCol       = conditionColor(avgCond);
  const inRepair     = allEquipment.filter((e) => e.status === "in_repair").length;
  const inTransfer   = allEquipment.filter((e) => e.status === "in_transfer").length;
  const needsAttn    = allEquipment.filter((e) => e.conditionRating <= 2).length;

  const statCards = [
    {
      label: "Total Items",
      value: allEquipment.length,
      icon: <Package className="h-4 w-4" />,
      bg: "bg-primary/10",
      iconColor: "text-primary",
      valueColor: "",
    },
    {
      label: "Avg Condition",
      value: allEquipment.length ? `${avgCond.toFixed(1)} / 5` : "—",
      icon: <Star className="h-4 w-4" />,
      bg: `bg-current/10`,
      iconColor: avgCol.text,
      valueColor: avgCol.text,
    },
    {
      label: "In Repair",
      value: inRepair,
      icon: <Wrench className="h-4 w-4" />,
      bg: "bg-orange-500/10",
      iconColor: "text-orange-600 dark:text-orange-400",
      valueColor: inRepair > 0 ? "text-orange-600 dark:text-orange-400" : "",
    },
    {
      label: "In Transfer",
      value: inTransfer,
      icon: <ArrowLeftRight className="h-4 w-4" />,
      bg: "bg-purple-500/10",
      iconColor: "text-purple-600 dark:text-purple-400",
      valueColor: inTransfer > 0 ? "text-purple-600 dark:text-purple-400" : "",
    },
  ];

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link href={isAdmin ? "/stations" : "/"}>
          <Button variant="ghost" size="icon" data-testid="button-back-station">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <h1 className="text-xl md:text-2xl font-bold" data-testid="text-station-detail-name">
              {station.name}
            </h1>
          </div>
          {(station.location || station.country) && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {[station.location, station.country].filter(Boolean).join(", ")}
            </p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 gap-1.5"
          onClick={() => startCheckMutation.mutate()}
          disabled={startCheckMutation.isPending}
          data-testid="button-start-inventory-check"
        >
          {startCheckMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ClipboardList className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">Inventory Check</span>
        </Button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map((card) => (
          <Card key={card.label}>
            <CardContent className="p-3 md:p-4">
              <div className="flex items-start justify-between gap-1">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    {card.label}
                  </p>
                  <p className={cn("text-2xl font-bold", card.valueColor)}>
                    {card.value}
                  </p>
                </div>
                <div className={cn("p-1.5 rounded-md", card.bg)}>
                  <span className={card.iconColor}>{card.icon}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Overall condition bar */}
      {allEquipment.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium">Overall condition</span>
            <span>
              {[5, 4, 3, 2, 1].map((r) => {
                const c = allEquipment.filter((e) => e.conditionRating === r).length;
                return c > 0 ? (
                  <span key={r} className={cn("mr-2", CONDITION_COLORS[r as keyof typeof CONDITION_COLORS].text)}>
                    ★{r}:{c}
                  </span>
                ) : null;
              })}
            </span>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden">
            <ConditionBar items={allEquipment} />
          </div>
        </div>
      )}

      {/* Category sections */}
      {allEquipment.length === 0 ? (
        <div className="text-center py-16">
          <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="font-medium">No equipment at this station</h3>
          <p className="text-sm text-muted-foreground mt-1">Add equipment from the Equipment page</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Kites */}
          {kites.length > 0 && (
            <CategoryCard
              icon={<KiteIcon className="h-4 w-4" />}
              title="Kites"
              items={kites}
              stationId={stationId}
              typeFilter="kite"
              renderContent={() => (
                <div className="space-y-3">
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium mb-2">
                      By size
                    </p>
                    <SizeCluster
                      items={kites}
                      getKey={(i) => {
                        const f = (i.typeSpecificFields || {}) as Record<string, any>;
                        return f.size != null ? String(f.size) : null;
                      }}
                      unit="m²"
                    />
                  </div>
                  <ColorCluster items={kites} />
                </div>
              )}
            />
          )}

          {/* Wings */}
          {wings.length > 0 && (
            <CategoryCard
              icon={<Wind className="h-4 w-4" />}
              title="Wings"
              items={wings}
              stationId={stationId}
              typeFilter="wing"
              renderContent={() => (
                <div className="space-y-3">
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium mb-2">
                      By size
                    </p>
                    <SizeCluster
                      items={wings}
                      getKey={(i) => {
                        const f = (i.typeSpecificFields || {}) as Record<string, any>;
                        return f.size != null ? String(f.size) : null;
                      }}
                      unit="m²"
                    />
                  </div>
                  <ColorCluster items={wings} />
                </div>
              )}
            />
          )}

          {/* Kiteboards */}
          {boards.length > 0 && (
            <CategoryCard
              icon={<Layers className="h-4 w-4" />}
              title="Kiteboards"
              items={boards}
              stationId={stationId}
              typeFilter="board"
              renderContent={() => (
                <div className="space-y-3">
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium mb-2">
                      By size
                    </p>
                    <SizeCluster
                      items={boards}
                      getKey={(i) => {
                        const f = (i.typeSpecificFields || {}) as Record<string, any>;
                        return f.size != null ? String(f.size) : null;
                      }}
                      unit="cm"
                    />
                  </div>
                  <BoardTypeCluster items={boards} />
                </div>
              )}
            />
          )}

          {/* Foilboards */}
          {foilboards.length > 0 && (
            <CategoryCard
              icon={<Layers className="h-4 w-4" />}
              title="Foilboards"
              items={foilboards}
              stationId={stationId}
              typeFilter="foilboard"
              renderContent={() => (
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium mb-2">
                    By size
                  </p>
                  <SizeCluster
                    items={foilboards}
                    getKey={(i) => {
                      const f = (i.typeSpecificFields || {}) as Record<string, any>;
                      return f.size != null ? String(f.size) : null;
                    }}
                    unit="cm"
                  />
                </div>
              )}
            />
          )}

          {/* Bars */}
          {barsLines.length > 0 && (
            <CategoryCard
              icon={<Link2 className="h-4 w-4" />}
              title="Bars"
              items={barsLines}
              stationId={stationId}
              typeFilter="bar_lines"
              renderContent={() => (
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium mb-2">
                    By line length
                  </p>
                  <SizeCluster
                    items={barsLines}
                    getKey={(i) => {
                      const f = (i.typeSpecificFields || {}) as Record<string, any>;
                      return f.lineLength != null ? String(f.lineLength) : null;
                    }}
                    unit="m"
                  />
                </div>
              )}
            />
          )}

          {/* Foils (if present, show in own card) */}
          {foils.length > 0 && (
            <CategoryCard
              icon={<FoilIcon className="h-4 w-4" />}
              title="Foils"
              items={foils}
              stationId={stationId}
              typeFilter="foil"
              renderContent={() => (
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium mb-2">
                    By mast length
                  </p>
                  <SizeCluster
                    items={foils}
                    getKey={(i) => {
                      const f = (i.typeSpecificFields || {}) as Record<string, any>;
                      return f.mastLength != null ? String(f.mastLength) : null;
                    }}
                    unit="cm"
                  />
                </div>
              )}
            />
          )}

          {/* Other gear */}
          {other.length > 0 && (
            <OtherCategory
              items={other}
              stationId={stationId}
            />
          )}
        </div>
      )}

      {/* Quick link to full list */}
      <div className="pt-2">
        <Link href={`/equipment?stationId=${stationId}`}>
          <Button variant="secondary" className="w-full" data-testid="button-view-all-equipment">
            View all {allEquipment.length} items as list
          </Button>
        </Link>
      </div>

      {/* Past inventory checks */}
      {pastChecks && pastChecks.length > 0 && (
        <div className="pb-4 space-y-3">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
            Inventory Reports
          </h2>
          {pastChecks.map((ic) => (
            <Link key={ic.id} href={`/inventory-check/${ic.id}`}>
              <Card className="hover-elevate cursor-pointer transition-all" data-testid={`card-inventory-check-${ic.id}`}>
                <CardContent className="p-3 flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-md shrink-0",
                    ic.status === "completed" ? "bg-green-500/10" : "bg-primary/10"
                  )}>
                    {ic.status === "completed"
                      ? <ClipboardCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
                      : <ClipboardList className="h-4 w-4 text-primary" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {new Date(ic.startedAt!).toLocaleDateString()}
                      </span>
                      <Badge
                        variant={ic.status === "completed" ? "default" : "secondary"}
                        className="text-[10px]"
                      >
                        {ic.status === "completed" ? "Completed" : "In Progress"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {ic.totalItems} items · {new Date(ic.startedAt!).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────

function ColorCluster({ items }: { items: Equipment[] }) {
  const colors: Record<string, number> = {};
  items.forEach((i) => {
    const f = (i.typeSpecificFields || {}) as Record<string, any>;
    const c = f.color;
    if (c) colors[c] = (colors[c] || 0) + 1;
  });
  const entries = Object.entries(colors);
  if (!entries.length) return null;
  return (
    <div>
      <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium mb-2">Colors</p>
      <div className="flex flex-wrap gap-1.5">
        {entries.map(([color, count]) => (
          <span
            key={color}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border"
          >
            {color} <span className="opacity-60">×{count}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function BoardTypeCluster({ items }: { items: Equipment[] }) {
  const types: Record<string, number> = {};
  items.forEach((i) => {
    const f = (i.typeSpecificFields || {}) as Record<string, any>;
    const t = f.boardType || "Unknown";
    types[t] = (types[t] || 0) + 1;
  });
  const entries = Object.entries(types);
  if (!entries.length) return null;
  return (
    <div>
      <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium mb-2">Board types</p>
      <div className="flex flex-wrap gap-1.5">
        {entries.map(([type, count]) => (
          <span
            key={type}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent/50 text-accent-foreground border border-border"
          >
            {type} <span className="opacity-60">×{count}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Custom SVG icons ─────────────────────────────────────────────
function KiteIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 2 L22 12 L12 18 L2 12 Z" />
      <line x1="12" y1="18" x2="12" y2="22" />
    </svg>
  );
}

function FoilIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 3 C7 3 3 7 3 12" />
      <path d="M12 3 C17 3 21 7 21 12" />
      <line x1="12" y1="3" x2="12" y2="21" />
      <line x1="6" y1="19" x2="18" y2="19" />
    </svg>
  );
}
