import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ConditionBadge, StatusBadge } from "@/components/condition-badge";
import { Plus, Search, Package, SlidersHorizontal, ScanLine, FileUp } from "lucide-react";
import type { Equipment, Station } from "@shared/schema";
import { EQUIPMENT_TYPE_LABELS, EQUIPMENT_TYPE_OPTIONS, TYPES_WITHOUT_SERIAL } from "@shared/schema";
import { BarcodeScanner } from "@/components/barcode-scanner";

const TYPE_BADGE: Record<string, { label: string; cls: string }> = {
  kite:          { label: "K",  cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  board:         { label: "KB", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
  foilboard:     { label: "WF", cls: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" },
  wing:          { label: "W",  cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
  bar_lines:     { label: "BR", cls: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
  wetsuit:       { label: "WS", cls: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300" },
  harness:       { label: "HA", cls: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" },
  helmet_safety: { label: "HE", cls: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300" },
  foil:          { label: "FO", cls: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
};


export default function EquipmentListPage() {
  const { isAdmin } = useAuth();
  const urlParams = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const [search, setSearch] = useState(urlParams.get("search") || "");
  const [typeFilter, setTypeFilter] = useState<string>(urlParams.get("type") || "all");
  const [statusFilter, setStatusFilter] = useState<string>(urlParams.get("status") || "all");
  const [stationFilter, setStationFilter] = useState<string>(urlParams.get("stationId") || "all");
  const [showFilters, setShowFilters] = useState(
    !!(urlParams.get("type") || urlParams.get("status") || urlParams.get("stationId"))
  );
  const [scannerOpen, setScannerOpen] = useState(false);
  const [sortCol, setSortCol] = useState("brand");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [, navigate] = useLocation();

  const buildQuery = () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (typeFilter !== "all") params.set("type", typeFilter);
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (stationFilter !== "all") params.set("stationId", stationFilter);
    const q = params.toString();
    return q ? `?${q}` : "";
  };

  const { data: equipment, isLoading } = useQuery<Equipment[]>({
    queryKey: ["/api/equipment", buildQuery()],
    queryFn: async () => {
      const res = await fetch(`/api/equipment${buildQuery()}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const { data: stationsList } = useQuery<Station[]>({
    queryKey: ["/api/stations"],
  });

  const getStationName = (id: number | null) => {
    if (!id) return "—";
    return stationsList?.find((s) => s.id === id)?.name || `Station ${id}`;
  };

  const handleScan = async (code: string) => {
    try {
      const res = await fetch(`/api/equipment/scan?serial=${encodeURIComponent(code)}`, { credentials: "include" });
      if (res.ok) {
        const item = await res.json();
        navigate(`/equipment/${item.id}`);
      } else {
        navigate(`/equipment/new?serial=${encodeURIComponent(code)}`);
      }
    } catch {
      navigate(`/equipment/new?serial=${encodeURIComponent(code)}`);
    }
  };

  const handleSort = (col: string) => {
    if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortCol(col); setSortDir("asc"); }
  };

  const sortedEquipment = useMemo(() => {
    const list = [...(equipment || [])];
    list.sort((a, b) => {
      let av: string | number = "";
      let bv: string | number = "";
      switch (sortCol) {
        case "type":      av = EQUIPMENT_TYPE_LABELS[a.type] || a.type; bv = EQUIPMENT_TYPE_LABELS[b.type] || b.type; break;
        case "brand":     av = a.brand.toLowerCase(); bv = b.brand.toLowerCase(); break;
        case "model":     av = a.model.toLowerCase(); bv = b.model.toLowerCase(); break;
        case "year":      av = a.yearOfPurchase ?? 0; bv = b.yearOfPurchase ?? 0; break;
        case "station":   av = getStationName(a.currentStationId); bv = getStationName(b.currentStationId); break;
        case "condition": av = a.conditionRating; bv = b.conditionRating; break;
        case "status":    av = a.status; bv = b.status; break;
        default:          av = a.brand.toLowerCase(); bv = b.brand.toLowerCase();
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [equipment, sortCol, sortDir, stationsList]);

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-1 flex-wrap">
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-equipment-title">Equipment</h1>
        {isAdmin && (
          <div className="flex gap-2">
            <Link href="/invoice-import">
              <Button variant="outline" size="sm" data-testid="button-import-invoice">
                <FileUp className="h-4 w-4 mr-1.5" />
                Import
              </Button>
            </Link>
            <Link href="/equipment/new">
              <Button size="sm" data-testid="button-add-equipment">
                <Plus className="h-4 w-4 mr-1.5" />
                Add
              </Button>
            </Link>
          </div>
        )}
      </div>

      <BarcodeScanner open={scannerOpen} onClose={() => setScannerOpen(false)} onScan={handleScan} />

      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search brand, model, serial..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              data-testid="input-search"
            />
          </div>
          <Button variant="secondary" size="icon" onClick={() => setScannerOpen(true)} title="Scan barcode" data-testid="button-scan-equipment">
            <ScanLine className="h-4 w-4" />
          </Button>
          <Button variant="secondary" size="icon" onClick={() => setShowFilters(!showFilters)} data-testid="button-toggle-filters">
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger data-testid="select-type-filter"><SelectValue placeholder="All Types" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {EQUIPMENT_TYPE_OPTIONS.map((key) => (
                  <SelectItem key={key} value={key}>{EQUIPMENT_TYPE_LABELS[key]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger data-testid="select-status-filter"><SelectValue placeholder="All Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="in_repair">In Repair</SelectItem>
                <SelectItem value="retired">Retired</SelectItem>
                <SelectItem value="sold">Sold</SelectItem>
                <SelectItem value="in_transfer">In Transfer</SelectItem>
              </SelectContent>
            </Select>
            {isAdmin && (
              <Select value={stationFilter} onValueChange={setStationFilter}>
                <SelectTrigger data-testid="select-station-filter"><SelectValue placeholder="All Locations" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {stationsList?.map((s) => (
                    <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}
      </div>

      {!isLoading && equipment && (
        <p className="text-xs text-muted-foreground">{equipment.length} item{equipment.length !== 1 ? "s" : ""}</p>
      )}

      {isLoading ? (
        <div className="space-y-1.5">
          {[...Array(10)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
        </div>
      ) : !sortedEquipment.length ? (
        <div className="text-center py-16">
          <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="font-medium text-lg">No equipment found</h3>
          <p className="text-muted-foreground text-sm mt-1">
            {search || typeFilter !== "all" || statusFilter !== "all"
              ? "Try adjusting your filters"
              : "Add your first piece of equipment"}
          </p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-xs">
                <SortTh col="type"      label="Type"    sortCol={sortCol} sortDir={sortDir} onSort={handleSort} className="w-12 pl-3 pr-2 py-2.5" />
                <SortTh col="brand"     label="Brand"   sortCol={sortCol} sortDir={sortDir} onSort={handleSort} className="px-2 py-2.5" />
                <SortTh col="model"     label="Model"   sortCol={sortCol} sortDir={sortDir} onSort={handleSort} className="px-2 py-2.5" />
                <th className="px-2 py-2.5 text-left font-medium text-muted-foreground w-16">Size</th>
                <SortTh col="year"      label="Year"    sortCol={sortCol} sortDir={sortDir} onSort={handleSort} className="px-2 py-2.5 hidden md:table-cell w-16" />
                <th className="px-2 py-2.5 text-left font-medium text-muted-foreground hidden md:table-cell">SKU</th>
                <th className="px-2 py-2.5 text-left font-medium text-muted-foreground hidden md:table-cell">Serial</th>
                <SortTh col="station"   label="Location" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} className="px-2 py-2.5 hidden lg:table-cell" />
                <SortTh col="condition" label="Cond"     sortCol={sortCol} sortDir={sortDir} onSort={handleSort} className="px-2 py-2.5 w-16" />
                <SortTh col="status"    label="Status"   sortCol={sortCol} sortDir={sortDir} onSort={handleSort} className="px-2 py-2.5 pr-3 hidden sm:table-cell w-24" />
              </tr>
            </thead>
            <tbody>
              {sortedEquipment.map((item) => {
                const badge = TYPE_BADGE[item.type] || { label: item.type.slice(0, 2).toUpperCase(), cls: "bg-muted text-muted-foreground" };
                const size = getSizeBadge(item);
                const noSerial = TYPES_WITHOUT_SERIAL.includes(item.type);
                return (
                  <tr
                    key={item.id}
                    className="border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => navigate(`/equipment/${item.id}`)}
                    data-testid={`row-equipment-${item.id}`}
                  >
                    <td className="pl-3 pr-2 py-2.5">
                      <span className={`inline-flex items-center justify-center rounded px-1.5 py-0.5 text-[10px] font-bold leading-none ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-2 py-2.5 font-medium whitespace-nowrap" data-testid={`text-brand-${item.id}`}>{item.brand}</td>
                    <td className="px-2 py-2.5 text-muted-foreground whitespace-nowrap" data-testid={`text-model-${item.id}`}>{item.model}</td>
                    <td className="px-2 py-2.5">
                      {size && (
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 leading-none whitespace-nowrap" data-testid={`badge-size-${item.id}`}>
                          {size}
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-2.5 text-xs text-muted-foreground hidden md:table-cell w-16" data-testid={`text-year-${item.id}`}>
                      {item.yearOfPurchase || ""}
                    </td>
                    <td className="px-2 py-2.5 font-mono text-xs text-muted-foreground hidden md:table-cell whitespace-nowrap" data-testid={`text-sku-${item.id}`}>
                      {item.sku || ""}
                    </td>
                    <td className="px-2 py-2.5 font-mono text-xs text-muted-foreground hidden md:table-cell max-w-[160px] truncate" data-testid={`text-serial-${item.id}`}>
                      {noSerial ? "" : (item.serialNumber || "")}
                    </td>
                    <td className="px-2 py-2.5 text-xs text-muted-foreground hidden lg:table-cell max-w-[140px] truncate">
                      {getStationName(item.currentStationId)}
                    </td>
                    <td className="px-2 py-2.5">
                      <ConditionBadge rating={item.conditionRating} compact />
                    </td>
                    <td className="px-2 py-2.5 pr-3 hidden sm:table-cell">
                      <StatusBadge status={item.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function getSizeBadge(item: Equipment): string | null {
  const f = (item.typeSpecificFields || {}) as Record<string, any>;
  switch (item.type) {
    case "kite":
    case "wing":
      return f.size != null && f.size !== "" ? `${f.size}m²` : null;
    case "board":
    case "foilboard":
      return f.size != null && f.size !== "" ? `${f.size}cm` : null;
    case "harness":
    case "wetsuit":
      return f.size ? String(f.size) : null;
    default:
      return null;
  }
}

function SortTh({
  col, label, sortCol, sortDir, onSort, className,
}: {
  col: string; label: string; sortCol: string; sortDir: "asc" | "desc";
  onSort: (col: string) => void; className?: string;
}) {
  const active = sortCol === col;
  return (
    <th
      className={`text-left font-medium text-muted-foreground select-none cursor-pointer hover:text-foreground transition-colors ${className ?? ""}`}
      onClick={() => onSort(col)}
    >
      <span className="inline-flex items-center gap-0.5">
        {label}
        <span className={`text-[10px] ${active ? "text-foreground" : "text-muted-foreground/30"}`}>
          {active ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
        </span>
      </span>
    </th>
  );
}
