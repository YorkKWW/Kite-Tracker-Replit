import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ConditionBadge, StatusBadge } from "@/components/condition-badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Search, Package, SlidersHorizontal, ScanLine, FileUp, Inbox, ArrowRightLeft, CheckSquare, Trash2, Send, ArrowLeft } from "lucide-react";
import type { Equipment, Station } from "@shared/schema";
import { EQUIPMENT_TYPE_LABELS, EQUIPMENT_TYPE_OPTIONS, TYPES_WITHOUT_SERIAL } from "@shared/schema";
import { BarcodeScanner } from "@/components/barcode-scanner";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const TYPE_BADGE: Record<string, { label: string; cls: string }> = {
  kite:          { label: "K",  cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  board:         { label: "KB", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
  foilboard:     { label: "WF", cls: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" },
  wing:          { label: "W",  cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
  bar_lines:     { label: "BR", cls: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
  foil:          { label: "FO", cls: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
};


export default function EquipmentListPage() {
  const { isAdmin, isHamburg, isSuperAdmin, isSimulating, simStationId, viewMode } = useAuth();
  const isStationLeadView = (isSimulating && viewMode === "station_lead" && simStationId != null);

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
  }, [simStationId, viewMode]);

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
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [transferStationId, setTransferStationId] = useState<string>("");
  const { toast } = useToast();

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      const res = await apiRequest("POST", "/api/equipment/bulk-delete", { ids });
      return res.json();
    },
    onSuccess: (data: { deleted: number; errors: string[] }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      toast({ title: `${data.deleted} item${data.deleted !== 1 ? "s" : ""} deleted` });
      if (data.errors.length > 0) {
        toast({ title: "Some items failed to delete", description: data.errors.join(", "), variant: "destructive" });
      } else {
        setSelectedIds(new Set());
        setSelectMode(false);
      }
    },
    onError: () => {
      toast({ title: "Bulk delete failed", description: "Please try again.", variant: "destructive" });
    },
  });

  const bulkTransferMutation = useMutation({
    mutationFn: async ({ equipmentIds, toStationId }: { equipmentIds: number[]; toStationId: number }) => {
      const res = await apiRequest("POST", "/api/transfers/bulk", { equipmentIds, toStationId });
      return res.json();
    },
    onSuccess: (data: { transferred: number; errors: string[] }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transfers"] });
      toast({ title: `${data.transferred} item${data.transferred !== 1 ? "s" : ""} transferred` });
      if (data.errors.length > 0) {
        toast({ title: "Some items could not be transferred", description: data.errors.join("\n"), variant: "destructive" });
      }
      if (data.transferred > 0) {
        setSelectedIds(new Set());
        setSelectMode(false);
      }
      setShowTransferDialog(false);
      setTransferStationId("");
    },
    onError: () => {
      toast({ title: "Bulk transfer failed", description: "Please try again.", variant: "destructive" });
    },
  });

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (!sortedEquipment.length) return;
    if (selectedIds.size === sortedEquipment.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedEquipment.map((e) => e.id)));
    }
  };

  const buildQuery = () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (typeFilter !== "all") params.set("type", typeFilter);
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (isStationLeadView) {
      params.set("stationId", String(simStationId));
      params.set("includeTransfers", "true");
    } else if (stationFilter !== "all") {
      params.set("stationId", stationFilter);
    }
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
    staleTime: 0,
  });

  const { data: stationsList } = useQuery<Station[]>({
    queryKey: ["/api/stations"],
  });

  const equipmentIds = equipment?.map((e) => e.id) ?? [];
  const { data: firstPhotos } = useQuery<Record<number, string>>({
    queryKey: ["/api/equipment/first-photos", equipmentIds.join(",")],
    queryFn: async () => {
      if (!equipmentIds.length) return {};
      const res = await fetch("/api/equipment/first-photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ids: equipmentIds }),
      });
      if (!res.ok) return {};
      return res.json();
    },
    enabled: equipmentIds.length > 0,
    staleTime: 30000,
  });

  const getStation = (id: number | null) => stationsList?.find((s) => s.id === id) ?? null;
  const getStationName = (id: number | null) => {
    if (!id) return "—";
    return getStation(id)?.name || `Station ${id}`;
  };
  const incomingStation = stationsList?.find((s) => s.isVirtual) ?? null;
  const incomingCount = equipment?.filter((e) => e.currentStationId === incomingStation?.id).length ?? 0;

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

  const isBulkSearch = search.includes(",") || search.includes("\n") || search.includes(";");

  const bulkSerialList = useMemo(() => {
    if (!isBulkSearch || !search.trim()) return null;
    return search
      .split(/[\n,;]+/)
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);
  }, [isBulkSearch, search]);

  const { data: allEquipment } = useQuery<Equipment[]>({
    queryKey: ["/api/equipment", "all-unfiltered"],
    queryFn: async () => {
      const res = await fetch("/api/equipment", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: isBulkSearch,
    staleTime: 0,
  });

  const sortedEquipment = useMemo(() => {
    let list = bulkSerialList && allEquipment
      ? [...allEquipment]
      : [...(equipment || [])];
    if (bulkSerialList && bulkSerialList.length > 0) {
      list = list.filter((e) => bulkSerialList.includes((e.serialNumber || "").toUpperCase()));
    }
    list.sort((a, b) => {
      let av: string | number = "";
      let bv: string | number = "";
      switch (sortCol) {
        case "type":      av = EQUIPMENT_TYPE_LABELS[a.type] || a.type; bv = EQUIPMENT_TYPE_LABELS[b.type] || b.type; break;
        case "brand":     av = a.brand.toLowerCase(); bv = b.brand.toLowerCase(); break;
        case "model":     av = a.model.toLowerCase(); bv = b.model.toLowerCase(); break;
        case "year":      av = a.yearOfPurchase ?? 0; bv = b.yearOfPurchase ?? 0; break;
        case "size":      av = getSizeValue(a); bv = getSizeValue(b); break;
        case "sku":       av = (a.sku || "").toLowerCase(); bv = (b.sku || "").toLowerCase(); break;
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
  }, [equipment, allEquipment, sortCol, sortDir, stationsList, bulkSerialList]);

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-1 flex-wrap">
        <div className="flex items-center gap-2">
          <Link href="/">
            <Button variant="ghost" size="icon" className="h-8 w-8" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-equipment-title">Equipment</h1>
        </div>
        <div className="flex gap-2">
          {(isSuperAdmin || isHamburg) && (
            <Button
              variant={selectMode ? "default" : "outline"}
              size="sm"
              onClick={() => { setSelectMode(!selectMode); setSelectedIds(new Set()); }}
              data-testid="button-toggle-select-mode"
            >
              <CheckSquare className="h-4 w-4 mr-1.5" />
              {selectMode ? "Cancel" : "Select"}
            </Button>
          )}
          {isHamburg && !selectMode && (
            <>
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
            </>
          )}
        </div>
      </div>

      <BarcodeScanner open={scannerOpen} onClose={() => setScannerOpen(false)} onScan={handleScan} />

      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search brand, model, serial… or paste multiple serials separated by comma"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`pl-9 ${isBulkSearch ? "font-mono text-xs" : ""}`}
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
        {isBulkSearch && bulkSerialList && bulkSerialList.length > 0 && (
          <div className="flex items-center gap-2 text-xs">
            <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">Bulk serial search</span>
            <span className="text-muted-foreground">
              {sortedEquipment.length} of {bulkSerialList.length} found
            </span>
            {bulkSerialList.length - sortedEquipment.length > 0 && (
              <span className="text-amber-600 dark:text-amber-400">
                · {bulkSerialList.length - sortedEquipment.length} not found
              </span>
            )}
          </div>
        )}

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
            {isHamburg && !isStationLeadView && (
              <Select value={stationFilter} onValueChange={setStationFilter}>
                <SelectTrigger data-testid="select-station-filter"><SelectValue placeholder="All Locations" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {stationsList?.map((s) => (
                    <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}
      </div>

      {isStationLeadView && stationsList && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-sky-50 border-sky-200 text-sky-800 dark:bg-sky-900/10 dark:border-sky-800 dark:text-sky-300 text-sm" data-testid="banner-station-scope">
          <Package className="h-4 w-4 shrink-0" />
          <span>
            Showing fleet for <strong>{stationsList.find(s => s.id === simStationId)?.name ?? `Station ${simStationId}`}</strong>
            {" "}+ equipment currently in transfer to/from this station
          </span>
        </div>
      )}

      {!isStationLeadView && !isLoading && incomingStation && incomingCount > 0 && (
        <button
          onClick={() => setStationFilter(stationFilter === incomingStation.id.toString() ? "all" : incomingStation.id.toString())}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors w-full sm:w-auto ${stationFilter === incomingStation.id.toString() ? "bg-amber-100 border-amber-400 text-amber-800 dark:bg-amber-900/30 dark:border-amber-600 dark:text-amber-300" : "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/10 dark:border-amber-800 dark:text-amber-400"}`}
          data-testid="button-filter-incoming"
        >
          <Inbox className="h-4 w-4" />
          <span>{incomingCount} item{incomingCount !== 1 ? "s" : ""} not yet assigned to a location</span>
        </button>
      )}

      {!isLoading && equipment && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <p className="text-xs text-muted-foreground">{equipment.length} item{equipment.length !== 1 ? "s" : ""}</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {[
              { label: "K",  cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",         name: "Kite",            key: "kite" },
              { label: "KB", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",     name: "Board",           key: "board" },
              { label: "WF", cls: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300", name: "Foilboard",       key: "foilboard" },
              { label: "W",  cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300", name: "Wing",         key: "wing" },
              { label: "BR", cls: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",        name: "Bar & Lines",     key: "bar_lines" },
              { label: "FO", cls: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",            name: "Foil",            key: "foil" },
            ].map(({ label, cls, name, key }) => {
              const active = typeFilter === key;
              return (
                <button
                  key={label}
                  onClick={() => setTypeFilter(active ? "all" : key)}
                  className={`flex items-center gap-1 text-xs rounded px-1 py-0.5 transition-colors ${active ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"}`}
                  title={active ? `Remove filter: ${name}` : `Filter by: ${name}`}
                >
                  <span className={`inline-flex items-center justify-center rounded font-bold text-[10px] w-5 h-5 ring-2 transition-all ${active ? "ring-foreground" : "ring-transparent"} ${cls}`}>{label}</span>
                  {name}
                </button>
              );
            })}
          </div>
        </div>
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
                {selectMode && (
                  <th className="w-10 pl-3 pr-1 py-2.5">
                    <Checkbox
                      checked={sortedEquipment.length > 0 && selectedIds.size === sortedEquipment.length}
                      onCheckedChange={toggleSelectAll}
                      data-testid="checkbox-select-all"
                    />
                  </th>
                )}
                <th className="w-9 pl-2 pr-1 py-2.5" />
                <SortTh col="type"      label="Type"    sortCol={sortCol} sortDir={sortDir} onSort={handleSort} className="w-12 pl-1 pr-2 py-2.5" />
                <SortTh col="brand"     label="Brand"   sortCol={sortCol} sortDir={sortDir} onSort={handleSort} className="px-2 py-2.5" />
                <SortTh col="model"     label="Model"   sortCol={sortCol} sortDir={sortDir} onSort={handleSort} className="px-2 py-2.5" />
                <SortTh col="size"      label="Size"    sortCol={sortCol} sortDir={sortDir} onSort={handleSort} className="px-2 py-2.5 w-16" />
                <SortTh col="year"      label="Year"    sortCol={sortCol} sortDir={sortDir} onSort={handleSort} className="px-2 py-2.5 hidden sm:table-cell w-16" />
                <SortTh col="sku"       label="SKU"     sortCol={sortCol} sortDir={sortDir} onSort={handleSort} className="px-2 py-2.5 hidden sm:table-cell" />
                <th className="px-2 py-2.5 text-left font-medium text-muted-foreground hidden sm:table-cell">Serial</th>
                <SortTh col="station"   label="Location" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} className="px-2 py-2.5 hidden lg:table-cell" />
                <SortTh col="condition" label="Cond"     sortCol={sortCol} sortDir={sortDir} onSort={handleSort} className="px-2 py-2.5 w-16" />
                <SortTh col="status"    label="Status"   sortCol={sortCol} sortDir={sortDir} onSort={handleSort} className="px-2 py-2.5 pr-3 hidden sm:table-cell w-24" />
              </tr>
            </thead>
            <tbody>
              {sortedEquipment.map((item) => {
                const badge = TYPE_BADGE[item.type] || { label: item.type.slice(0, 2).toUpperCase(), cls: "bg-muted text-muted-foreground" };
                const size = getSizeBadge(item);
                const noSerial = TYPES_WITHOUT_SERIAL.includes(item.type) || !!item.serialNumber?.startsWith("AUTO-") || !!item.serialNumber?.startsWith("IMPORT-");
                return (
                  <tr
                    key={item.id}
                    className="border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => selectMode ? toggleSelect(item.id) : navigate(`/equipment/${item.id}`)}
                    data-testid={`row-equipment-${item.id}`}
                  >
                    {selectMode && (
                      <td className="pl-3 pr-1 py-2.5 w-10" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedIds.has(item.id)}
                          onCheckedChange={() => toggleSelect(item.id)}
                          data-testid={`checkbox-equipment-${item.id}`}
                        />
                      </td>
                    )}
                    <td className="pl-2 pr-1 py-1.5 w-9">
                      {firstPhotos?.[item.id] ? (
                        <img
                          src={firstPhotos[item.id]}
                          alt=""
                          className="w-8 h-8 rounded object-cover shrink-0"
                          data-testid={`img-thumbnail-${item.id}`}
                        />
                      ) : (
                        <div className="w-8 h-8 rounded bg-muted/50 shrink-0" />
                      )}
                    </td>
                    <td className="pl-1 pr-2 py-2.5">
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
                    <td className="px-2 py-2.5 hidden sm:table-cell w-16" data-testid={`text-year-${item.id}`}>
                      {item.yearOfPurchase ? <YearBadge year={item.yearOfPurchase} /> : ""}
                    </td>
                    <td className="px-2 py-2.5 font-mono text-xs text-muted-foreground hidden sm:table-cell whitespace-nowrap" data-testid={`text-sku-${item.id}`}>
                      {item.sku || ""}
                    </td>
                    <td className="px-2 py-2.5 font-mono text-xs text-muted-foreground hidden sm:table-cell max-w-[160px] truncate" data-testid={`text-serial-${item.id}`}>
                      {noSerial ? "" : (item.serialNumber || "")}
                    </td>
                    <td className="px-2 py-2.5 text-xs hidden lg:table-cell max-w-[140px] truncate">
                      {(() => {
                        const st = getStation(item.currentStationId);
                        if (!st?.isVirtual) return <span className="text-muted-foreground">{getStationName(item.currentStationId)}</span>;
                        if (st.name === "In Transfer") return (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 whitespace-nowrap">
                            <ArrowRightLeft className="h-3 w-3" /> In Transit
                          </span>
                        );
                        return (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 whitespace-nowrap">
                            <Inbox className="h-3 w-3" /> Incoming
                          </span>
                        );
                      })()}
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

      {selectMode && selectedIds.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t shadow-lg p-3 flex items-center justify-between gap-3 safe-area-bottom">
          <span className="text-sm font-medium" data-testid="text-selected-count">
            {selectedIds.size} selected
          </span>
          <div className="flex items-center gap-2">
            {isHamburg && (
              <Button
                size="sm"
                onClick={() => setShowTransferDialog(true)}
                data-testid="button-bulk-transfer"
              >
                <Send className="h-4 w-4 mr-1.5" />
                Transfer
              </Button>
            )}
            {isSuperAdmin && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                data-testid="button-bulk-delete"
              >
                <Trash2 className="h-4 w-4 mr-1.5" />
                Delete
              </Button>
            )}
          </div>
        </div>
      )}

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.size} item{selectedIds.size !== 1 ? "s" : ""}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the selected equipment and all related data (photos, repairs, transfers, damage reports). This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => bulkDeleteMutation.mutate(Array.from(selectedIds))}
              disabled={bulkDeleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {bulkDeleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showTransferDialog} onOpenChange={(open) => { setShowTransferDialog(open); if (!open) setTransferStationId(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle data-testid="text-transfer-dialog-title">Transfer {selectedIds.size} item{selectedIds.size !== 1 ? "s" : ""}</DialogTitle>
            <DialogDescription>
              Select the destination station for the selected equipment.
            </DialogDescription>
          </DialogHeader>
          <Select value={transferStationId} onValueChange={setTransferStationId}>
            <SelectTrigger data-testid="select-transfer-station">
              <SelectValue placeholder="Select station" />
            </SelectTrigger>
            <SelectContent>
              {stationsList?.filter(s => !s.isVirtual).map(s => (
                <SelectItem key={s.id} value={s.id.toString()} data-testid={`option-station-${s.id}`}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowTransferDialog(false); setTransferStationId(""); }} data-testid="button-cancel-transfer">
              Cancel
            </Button>
            <Button
              onClick={() => bulkTransferMutation.mutate({ equipmentIds: Array.from(selectedIds), toStationId: parseInt(transferStationId) })}
              disabled={!transferStationId || bulkTransferMutation.isPending}
              data-testid="button-confirm-transfer"
            >
              {bulkTransferMutation.isPending ? "Transferring..." : "Transfer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
    default:
      return null;
  }
}

function getSizeValue(item: Equipment): number | string {
  const f = (item.typeSpecificFields || {}) as Record<string, any>;
  switch (item.type) {
    case "kite":
    case "wing":
    case "board":
    case "foilboard":
      return f.size != null && f.size !== "" ? Number(f.size) : 0;
    default:
      return 0;
  }
}

function YearBadge({ year }: { year: number }) {
  const current = new Date().getFullYear();
  const age = current - year;
  const cls =
    age === 0 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" :
    age === 1 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300" :
    age === 2 ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" :
                "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
  return (
    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold leading-none whitespace-nowrap ${cls}`}>
      {year}
    </span>
  );
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
