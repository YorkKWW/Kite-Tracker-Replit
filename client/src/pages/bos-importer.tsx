import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronDown, ChevronRight, CheckCircle2, RefreshCw, AlertCircle,
  Clock, Trash2, ArrowUpDown, Package, User, BookOpen, Play,
  Download, Filter,
} from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { apiRequest } from "@/lib/queryClient";

// ── Types ────────────────────────────────────────────────────────────────────
type BosImportLog = {
  id: number; schoolConfigId: number; runAt: string; bosRef: string; bosVersion: string | null;
  recordType: "customer" | "booking" | "booking_item";
  status: "created" | "updated" | "unchanged" | "deleted" | "skipped" | "error";
  skipReason: string | null; customerId: number | null; bookingId: number | null;
  customerName: string | null; bookingNumber: string | null;
  itemName: string | null; itemPrice: string | null; rawData: Record<string, any> | null;
};

type BosPreviewRow = {
  bookingNumber: string; operationId: string; travellerBosNr: string; customerName: string;
  isMainTraveller: boolean; arrivalDate: string; departureDate: string;
  items: { code: string; name: string; price: string; mapped: boolean }[];
  totalAmount: string; importStatus: "new" | "updated" | "unchanged" | "storno";
  bosVersion: string; notes: string | null;
};

type SchoolConfig = { id: number; stationName: string };

// ── Grouped log structures ────────────────────────────────────────────────────
type BookingGroup = { booking: BosImportLog; items: BosImportLog[] };
type CustomerGroup = { customer: BosImportLog; bookings: BookingGroup[] };

function groupLogs(logs: BosImportLog[]): { groups: CustomerGroup[]; orphanBookings: BosImportLog[] } {
  const customerLogs = logs.filter(l => l.recordType === "customer");
  const bookingLogs = logs.filter(l => l.recordType === "booking");
  const itemLogs = logs.filter(l => l.recordType === "booking_item");
  const groups: CustomerGroup[] = customerLogs.map(cust => ({
    customer: cust,
    bookings: bookingLogs.filter(b => b.customerId === cust.customerId).map(bkg => ({
      booking: bkg,
      items: itemLogs.filter(i => i.bookingId === bkg.bookingId),
    })),
  }));
  const matchedCustomerIds = new Set(customerLogs.map(c => c.customerId).filter(Boolean));
  const orphanBookings = bookingLogs.filter(b => !b.customerId || !matchedCustomerIds.has(b.customerId));
  return { groups, orphanBookings };
}

// ── Shared: Status badge ─────────────────────────────────────────────────────
const STATUS_CFG = {
  created:   { label: "Neu erstellt",  color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800" },
  updated:   { label: "Aktualisiert",  color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800" },
  unchanged: { label: "Unverändert",   color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700" },
  deleted:   { label: "Gelöscht",      color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800" },
  skipped:   { label: "Übersprungen",  color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800" },
  error:     { label: "Fehler",        color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800" },
  new:       { label: "Neu",           color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800" },
  storno:    { label: "Storno",        color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800" },
} as const;

function StatusBadge({ status }: { status: keyof typeof STATUS_CFG }) {
  const cfg = STATUS_CFG[status];
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

function formatDateRange(arrival: string, departure: string) {
  try {
    const a = format(new Date(arrival), "dd.MM.", { locale: de });
    const d = format(new Date(departure), "dd.MM.yy", { locale: de });
    return `${a}–${d}`;
  } catch { return `${arrival} – ${departure}`; }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 1: IMPORT PREVIEW
// ═══════════════════════════════════════════════════════════════════════════════
function ImportTab({ schoolConfigId }: { schoolConfigId: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<"all" | "new" | "updated" | "unchanged" | "storno">("all");

  const { data: preview, isLoading, refetch, isFetching } = useQuery<BosPreviewRow[]>({
    queryKey: ["/api/bos-import/preview", schoolConfigId],
    queryFn: async () => {
      const res = await fetch(`/api/bos-import/preview/${schoolConfigId}`);
      if (!res.ok) throw new Error("Fehler beim Laden der BOS-Vorschau");
      return res.json();
    },
    enabled: false,
  });

  const importMutation = useMutation({
    mutationFn: async (bookingNumbers: string[]) => {
      return apiRequest("POST", `/api/bos-import/run/${schoolConfigId}`, { bookingNumbers });
    },
    onSuccess: (data: any) => {
      toast({ title: "Import erfolgreich", description: `${data.customers?.created ?? 0} Kunden, ${data.bookings?.created ?? 0} Buchungen neu erstellt.` });
      queryClient.invalidateQueries({ queryKey: ["/api/bos-import-logs", schoolConfigId] });
      setSelected(new Set());
      refetch();
    },
    onError: (e: any) => toast({ title: "Import fehlgeschlagen", description: e.message, variant: "destructive" }),
  });

  const filtered = (preview ?? []).filter(r => statusFilter === "all" || r.importStatus === statusFilter);
  const selectableRows = filtered.filter(r => r.importStatus !== "storno" && r.importStatus !== "unchanged");

  const allSelectableSelected = selectableRows.length > 0 && selectableRows.every(r => selected.has(r.bookingNumber));
  const someSelected = selectableRows.some(r => selected.has(r.bookingNumber));

  function toggleAll() {
    if (allSelectableSelected) {
      const next = new Set(selected);
      selectableRows.forEach(r => next.delete(r.bookingNumber));
      setSelected(next);
    } else {
      const next = new Set(selected);
      selectableRows.forEach(r => next.add(r.bookingNumber));
      setSelected(next);
    }
  }

  function selectOnlyNew() {
    setSelected(new Set((preview ?? []).filter(r => r.importStatus === "new").map(r => r.bookingNumber)));
  }

  function toggleRow(bn: string) {
    const next = new Set(selected);
    if (next.has(bn)) next.delete(bn); else next.add(bn);
    setSelected(next);
  }

  const selectedCount = [...selected].filter(bn => (preview ?? []).find(r => r.bookingNumber === bn)).length;

  // KPI counts
  const counts = { new: 0, updated: 0, unchanged: 0, storno: 0 };
  for (const r of preview ?? []) counts[r.importStatus]++;

  return (
    <div className="space-y-4">
      {/* Header actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button onClick={() => refetch()} disabled={isFetching} variant="outline" size="sm" data-testid="button-load-preview">
          <Download className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
          {preview ? "Vorschau aktualisieren" : "BOS-Daten laden"}
        </Button>
        {preview && (
          <>
            <div className="flex items-center gap-1.5 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1">
              <Filter className="h-3.5 w-3.5 text-gray-400" />
              <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                <SelectTrigger className="h-7 text-xs border-none shadow-none px-1 w-36" data-testid="select-preview-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle ({(preview ?? []).length})</SelectItem>
                  <SelectItem value="new">Nur Neu ({counts.new})</SelectItem>
                  <SelectItem value="updated">Nur Aktualisiert ({counts.updated})</SelectItem>
                  <SelectItem value="unchanged">Nur Unverändert ({counts.unchanged})</SelectItem>
                  <SelectItem value="storno">Nur Storno ({counts.storno})</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="ghost" size="sm" onClick={selectOnlyNew} className="text-xs" data-testid="button-select-new">
              Nur neue auswählen
            </Button>
            {selectedCount > 0 && (
              <Button
                size="sm"
                onClick={() => importMutation.mutate([...selected])}
                disabled={importMutation.isPending}
                data-testid="button-run-import"
                className="ml-auto"
              >
                <Play className={`h-4 w-4 mr-2 ${importMutation.isPending ? "animate-pulse" : ""}`} />
                {importMutation.isPending ? "Importiere…" : `${selectedCount} importieren`}
              </Button>
            )}
          </>
        )}
      </div>

      {/* KPI pills */}
      {preview && (
        <div className="flex flex-wrap gap-2 text-xs">
          {counts.new > 0 && <span className="px-2.5 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800 font-medium">{counts.new} neu</span>}
          {counts.updated > 0 && <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800 font-medium">{counts.updated} aktualisiert</span>}
          {counts.unchanged > 0 && <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700 font-medium">{counts.unchanged} unverändert</span>}
          {counts.storno > 0 && <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800 font-medium">{counts.storno} storno</span>}
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-400">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
          <p className="text-sm">Lade BOS-Daten…</p>
        </div>
      ) : !preview ? (
        <div className="text-center py-16 text-gray-400 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
          <Download className="h-8 w-8 mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">Noch keine Vorschau geladen</p>
          <p className="text-xs mt-1">Klicke auf "BOS-Daten laden" um die aktuellen Daten abzurufen</p>
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center py-8 text-sm text-gray-400">Keine Einträge für diesen Filter.</p>
      ) : (
        <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
          {/* Table header */}
          <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-500">
            <Checkbox
              checked={allSelectableSelected}
              onCheckedChange={toggleAll}
              aria-label="Alle auswählen"
              data-testid="checkbox-select-all"
              className="flex-shrink-0"
            />
            <span className="flex-1">Kunde / Buchung</span>
            <span className="w-28 text-right hidden sm:block">Zeitraum</span>
            <span className="w-40 hidden md:block">Leistungen</span>
            <span className="w-20 text-right hidden sm:block">Gesamt</span>
            <span className="w-24 text-right">Status</span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {filtered.map(row => {
              const isSelectable = row.importStatus !== "storno" && row.importStatus !== "unchanged";
              const isChecked = selected.has(row.bookingNumber);
              return (
                <div
                  key={row.bookingNumber}
                  className={`flex items-start gap-3 px-4 py-3 transition-colors ${isSelectable ? "hover:bg-gray-50 dark:hover:bg-gray-800/30 cursor-pointer" : "opacity-60"} ${isChecked ? "bg-indigo-50/50 dark:bg-indigo-950/20" : ""}`}
                  onClick={() => isSelectable && toggleRow(row.bookingNumber)}
                  data-testid={`preview-row-${row.bookingNumber}`}
                >
                  <Checkbox
                    checked={isChecked}
                    disabled={!isSelectable}
                    onCheckedChange={() => isSelectable && toggleRow(row.bookingNumber)}
                    onClick={e => e.stopPropagation()}
                    data-testid={`checkbox-${row.bookingNumber}`}
                    className="mt-0.5 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <User className="h-3.5 w-3.5 text-violet-400 flex-shrink-0" />
                      <span className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">{row.customerName}</span>
                      <span className="font-mono text-xs text-indigo-500 dark:text-indigo-400">{row.bookingNumber}</span>
                      {!row.isMainTraveller && <span className="text-xs text-gray-400 border border-gray-200 dark:border-gray-700 rounded px-1">Sub</span>}
                    </div>
                    {/* Items summary (mobile-visible) */}
                    {row.items.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1 md:hidden">
                        {row.items.map((item, i) => (
                          <span key={i} className={`text-xs px-1.5 py-0.5 rounded border ${item.mapped ? "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-900/20 dark:text-teal-400 dark:border-teal-800" : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800"}`}>
                            {item.name} ({parseFloat(item.price).toLocaleString("de-DE", { minimumFractionDigits: 0 })}€)
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="w-28 text-right text-xs text-gray-500 flex-shrink-0 hidden sm:block pt-0.5">
                    {formatDateRange(row.arrivalDate, row.departureDate)}
                  </div>
                  <div className="w-40 hidden md:block">
                    {row.items.length === 0 ? (
                      <span className="text-xs text-gray-400">–</span>
                    ) : (
                      <div className="space-y-0.5">
                        {row.items.map((item, i) => (
                          <div key={i} className={`text-xs truncate ${item.mapped ? "text-gray-700 dark:text-gray-300" : "text-amber-600"}`}>
                            <Package className="h-2.5 w-2.5 inline mr-1 opacity-60" />
                            {item.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="w-20 text-right text-sm font-mono font-medium text-gray-700 dark:text-gray-300 flex-shrink-0 hidden sm:block pt-0.5">
                    {parseFloat(row.totalAmount) > 0
                      ? `${parseFloat(row.totalAmount).toLocaleString("de-DE", { minimumFractionDigits: 0 })} €`
                      : "–"}
                  </div>
                  <div className="w-24 text-right flex-shrink-0">
                    <StatusBadge status={row.importStatus} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          {someSelected && (
            <div className="flex items-center justify-between px-4 py-2.5 bg-indigo-50 dark:bg-indigo-950/30 border-t border-indigo-100 dark:border-indigo-900">
              <span className="text-sm text-indigo-700 dark:text-indigo-300">{selectedCount} ausgewählt</span>
              <Button
                size="sm"
                onClick={() => importMutation.mutate([...selected])}
                disabled={importMutation.isPending}
                data-testid="button-run-import-footer"
              >
                <Play className={`h-3.5 w-3.5 mr-1.5 ${importMutation.isPending ? "animate-pulse" : ""}`} />
                {importMutation.isPending ? "Importiere…" : "Ausgewählte importieren"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 2: LOG VIEW
// ═══════════════════════════════════════════════════════════════════════════════
function LogTab({ schoolConfigId }: { schoolConfigId: string }) {
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const { data: logs = [], isLoading, refetch, isFetching } = useQuery<BosImportLog[]>({
    queryKey: ["/api/bos-import-logs", schoolConfigId],
    queryFn: async () => {
      const res = await fetch(`/api/bos-import-logs/${schoolConfigId}`);
      if (!res.ok) throw new Error("Fehler beim Laden der Logs");
      return res.json();
    },
    enabled: !!schoolConfigId,
  });

  const { groups, orphanBookings } = groupLogs(logs);
  const filteredGroups = filterStatus === "all" ? groups : groups.filter(g => g.customer.status === filterStatus);
  const customerLogs = logs.filter(l => l.recordType === "customer");
  const bookingLogs = logs.filter(l => l.recordType === "booking");
  const itemLogs = logs.filter(l => l.recordType === "booking_item");

  return (
    <div className="space-y-4">
      {/* KPI + refresh */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-3">
          <div className="text-xs text-gray-500"><span className="font-bold text-violet-600 dark:text-violet-400 text-base mr-1">{customerLogs.length}</span>Kunden</div>
          <div className="text-xs text-gray-500"><span className="font-bold text-indigo-600 dark:text-indigo-400 text-base mr-1">{bookingLogs.length}</span>Buchungen</div>
          <div className="text-xs text-gray-500"><span className="font-bold text-teal-600 dark:text-teal-400 text-base mr-1">{itemLogs.length}</span>Leistungen</div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40 h-8 text-xs" data-testid="select-filter-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Kunden</SelectItem>
              <SelectItem value="created">Neu erstellt</SelectItem>
              <SelectItem value="updated">Aktualisiert</SelectItem>
              <SelectItem value="unchanged">Unverändert</SelectItem>
              <SelectItem value="skipped">Übersprungen</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} data-testid="button-refresh-logs">
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Log groups */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-400">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
          <p className="text-sm">Lade Logs…</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 text-gray-400 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
          <p className="text-sm">Noch keine Import-Datensätze vorhanden.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredGroups.map(group => <CustomerGroupRow key={group.customer.id} group={group} />)}
          {orphanBookings.map(b => <OrphanBookingRow key={b.id} booking={b} />)}
          {filteredGroups.length === 0 && orphanBookings.length === 0 && (
            <p className="text-sm text-center py-8 text-gray-400">Keine Einträge für diesen Filter.</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Log view sub-components ───────────────────────────────────────────────────
function RawDataView({ data }: { data: Record<string, any> }) {
  return (
    <pre className="text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded p-3 overflow-x-auto max-h-48 whitespace-pre-wrap break-words">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

function ItemRow({ item }: { item: BosImportLog }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300">
      <Package className="h-3.5 w-3.5 text-teal-500 flex-shrink-0 ml-1" />
      <span className="flex-1 truncate">{item.itemName || "–"}</span>
      {item.itemPrice && (
        <span className="font-mono text-xs text-gray-500 flex-shrink-0">
          {parseFloat(item.itemPrice).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
        </span>
      )}
      <StatusBadge status={item.status} />
    </div>
  );
}

function BookingRow({ group }: { group: BookingGroup }) {
  const [expanded, setExpanded] = useState(false);
  const { booking, items } = group;
  return (
    <div className="border border-indigo-100 dark:border-indigo-900/50 rounded-md overflow-hidden bg-indigo-50/30 dark:bg-indigo-950/10">
      <button className="w-full flex items-center gap-2 px-3 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 transition-colors text-left" onClick={() => setExpanded(!expanded)} data-testid={`booking-row-${booking.id}`}>
        <span className="text-indigo-400 flex-shrink-0">{expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}</span>
        <BookOpen className="h-3.5 w-3.5 text-indigo-500 flex-shrink-0" />
        <span className="font-mono text-xs text-indigo-700 dark:text-indigo-300 font-medium flex-shrink-0">{booking.bookingNumber}</span>
        <StatusBadge status={booking.status} />
        {booking.skipReason && <span className="text-xs text-amber-600 truncate">{booking.skipReason}</span>}
        {items.length > 0 && <span className="ml-auto text-xs text-gray-400 flex-shrink-0">{items.length} Leistung{items.length !== 1 ? "en" : ""}</span>}
      </button>
      {expanded && (
        <div className="border-t border-indigo-100 dark:border-indigo-900/50">
          {items.length > 0 && <div className="divide-y divide-indigo-50 dark:divide-indigo-900/30">{items.map(item => <ItemRow key={item.id} item={item} />)}</div>}
          {booking.rawData && <div className="px-3 pb-3 pt-2"><div className="text-xs font-medium text-gray-400 mb-1">Rohdaten (BOS)</div><RawDataView data={booking.rawData} /></div>}
        </div>
      )}
    </div>
  );
}

function CustomerGroupRow({ group }: { group: CustomerGroup }) {
  const [expanded, setExpanded] = useState(false);
  const { customer, bookings } = group;
  const totalItems = bookings.reduce((n, b) => n + b.items.length, 0);
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden" data-testid={`customer-group-${customer.id}`}>
      <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors text-left bg-white dark:bg-gray-900" onClick={() => setExpanded(!expanded)} data-testid={`customer-row-${customer.id}`}>
        <span className="text-gray-400 flex-shrink-0">{expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</span>
        <User className="h-4 w-4 text-violet-500 flex-shrink-0" />
        <span className="font-semibold text-sm text-gray-900 dark:text-gray-100 flex-1">{customer.customerName || "–"}</span>
        <StatusBadge status={customer.status} />
        <span className="text-xs text-gray-400 font-mono flex-shrink-0">BOS #{customer.bosRef}</span>
        <span className="text-xs text-gray-400 flex-shrink-0 hidden sm:inline">{bookings.length} Buchung{bookings.length !== 1 ? "en" : ""} · {totalItems} Leistung{totalItems !== 1 ? "en" : ""}</span>
        <span className="text-xs text-gray-400 flex-shrink-0">{format(new Date(customer.runAt), "dd.MM.yy HH:mm", { locale: de })}</span>
      </button>
      {expanded && (
        <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/20 px-4 py-3 space-y-2">
          {customer.rawData && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-500 pb-2">
              {customer.customerId && <div><span className="font-medium text-gray-400">Kunden-ID</span><div className="font-mono font-medium text-gray-700 dark:text-gray-300">{customer.customerId}</div></div>}
              {customer.rawData.email && <div><span className="font-medium text-gray-400">E-Mail</span><div className="truncate text-gray-700 dark:text-gray-300">{customer.rawData.email}</div></div>}
              {customer.rawData.nationality && <div><span className="font-medium text-gray-400">Land</span><div className="text-gray-700 dark:text-gray-300">{customer.rawData.nationality}</div></div>}
              {customer.rawData.kiteLevel && <div><span className="font-medium text-gray-400">Kite-Level</span><div className="text-gray-700 dark:text-gray-300">{customer.rawData.kiteLevel}</div></div>}
            </div>
          )}
          {bookings.length > 0 && <div className="space-y-2">{bookings.map(b => <BookingRow key={b.booking.id} group={b} />)}</div>}
        </div>
      )}
    </div>
  );
}

function OrphanBookingRow({ booking }: { booking: BosImportLog }) {
  return (
    <div className="border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 flex items-center gap-3 bg-amber-50/40 dark:bg-amber-950/10">
      <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
      <BookOpen className="h-4 w-4 text-amber-400 flex-shrink-0" />
      <span className="font-mono text-sm text-amber-700 dark:text-amber-300">{booking.bookingNumber}</span>
      <StatusBadge status={booking.status} />
      {booking.skipReason && <span className="text-xs text-amber-600 flex-1">{booking.skipReason}</span>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function BosImporterPage() {
  const { isSuperAdmin } = useAuth();
  const [selectedConfigId, setSelectedConfigId] = useState<string>("");

  const { data: configs = [] } = useQuery<SchoolConfig[]>({
    queryKey: ["/api/school-configs"],
    enabled: !!isSuperAdmin,
  });

  const firstConfig = configs[0];
  const effectiveConfigId = selectedConfigId || (firstConfig ? String(firstConfig.id) : "");

  if (!isSuperAdmin) {
    return <div className="flex items-center justify-center min-h-[60vh]"><p className="text-gray-500">Kein Zugriff</p></div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">BOS Importer</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">KiteWorldWide BOS-Daten manuell importieren</p>
        </div>
        {configs.length > 1 && (
          <Select value={effectiveConfigId} onValueChange={setSelectedConfigId}>
            <SelectTrigger className="w-52" data-testid="select-school-config">
              <SelectValue placeholder="Schule wählen" />
            </SelectTrigger>
            <SelectContent>
              {configs.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.stationName}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Tabs */}
      {effectiveConfigId && (
        <Tabs defaultValue="import">
          <TabsList className="mb-4">
            <TabsTrigger value="import" data-testid="tab-import">Importieren</TabsTrigger>
            <TabsTrigger value="log" data-testid="tab-log">Protokoll</TabsTrigger>
          </TabsList>
          <TabsContent value="import">
            <ImportTab schoolConfigId={effectiveConfigId} />
          </TabsContent>
          <TabsContent value="log">
            <LogTab schoolConfigId={effectiveConfigId} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
