import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ChevronDown, ChevronRight, CheckCircle2, RefreshCw, AlertCircle,
  Clock, Trash2, ArrowUpDown, Package, User, BookOpen,
} from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

type BosImportLog = {
  id: number;
  schoolConfigId: number;
  runAt: string;
  bosRef: string;
  bosVersion: string | null;
  recordType: "customer" | "booking" | "booking_item";
  status: "created" | "updated" | "unchanged" | "deleted" | "skipped" | "error";
  skipReason: string | null;
  customerId: number | null;
  bookingId: number | null;
  customerName: string | null;
  bookingNumber: string | null;
  itemName: string | null;
  itemPrice: string | null;
  rawData: Record<string, any> | null;
};

type SchoolConfig = { id: number; stationName: string };

// ── Grouped data structure ──────────────────────────────────────────────────
type BookingGroup = { booking: BosImportLog; items: BosImportLog[] };
type CustomerGroup = {
  customer: BosImportLog;
  bookings: BookingGroup[];
};

function groupLogs(logs: BosImportLog[]): { groups: CustomerGroup[]; orphanBookings: BosImportLog[] } {
  const customerLogs = logs.filter(l => l.recordType === "customer");
  const bookingLogs = logs.filter(l => l.recordType === "booking");
  const itemLogs = logs.filter(l => l.recordType === "booking_item");

  const groups: CustomerGroup[] = customerLogs.map(cust => {
    const custBookings = bookingLogs.filter(b => b.customerId === cust.customerId);
    const bookings: BookingGroup[] = custBookings.map(bkg => ({
      booking: bkg,
      items: itemLogs.filter(i => i.bookingId === bkg.bookingId),
    }));
    return { customer: cust, bookings };
  });

  // Bookings without a matched customer log (e.g. skipped)
  const matchedCustomerIds = new Set(customerLogs.map(c => c.customerId).filter(Boolean));
  const orphanBookings = bookingLogs.filter(b => !b.customerId || !matchedCustomerIds.has(b.customerId));

  return { groups, orphanBookings };
}

// ── Status badge ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<BosImportLog["status"], { label: string; color: string }> = {
  created:   { label: "Neu erstellt",  color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800" },
  updated:   { label: "Aktualisiert",  color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800" },
  unchanged: { label: "Unverändert",   color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700" },
  deleted:   { label: "Gelöscht",      color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800" },
  skipped:   { label: "Übersprungen",  color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800" },
  error:     { label: "Fehler",        color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800" },
};

function StatusBadge({ status }: { status: BosImportLog["status"] }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = status === "created" ? CheckCircle2 : status === "updated" ? ArrowUpDown : status === "unchanged" ? Clock : status === "deleted" ? Trash2 : AlertCircle;
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${cfg.color}`}>
      <Icon className="h-3 w-3" />{cfg.label}
    </span>
  );
}

function RawDataView({ data }: { data: Record<string, any> }) {
  return (
    <pre className="text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded p-3 overflow-x-auto max-h-48 whitespace-pre-wrap break-words">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

// ── Booking item row (leaf, no expand) ──────────────────────────────────────
function ItemRow({ item }: { item: BosImportLog }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300">
      <Package className="h-3.5 w-3.5 text-teal-500 flex-shrink-0 ml-1" />
      <span className="flex-1 truncate">{item.itemName || "–"}</span>
      {item.itemPrice && (
        <span className="font-mono text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
          {parseFloat(item.itemPrice).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
        </span>
      )}
      <StatusBadge status={item.status} />
    </div>
  );
}

// ── Booking row (expandable, shows items + raw data) ────────────────────────
function BookingRow({ group }: { group: BookingGroup }) {
  const [expanded, setExpanded] = useState(false);
  const { booking, items } = group;
  return (
    <div className="border border-indigo-100 dark:border-indigo-900/50 rounded-md overflow-hidden bg-indigo-50/30 dark:bg-indigo-950/10">
      <button
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 transition-colors text-left"
        onClick={() => setExpanded(!expanded)}
        data-testid={`booking-row-${booking.id}`}
      >
        <span className="text-indigo-400 flex-shrink-0">
          {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        </span>
        <BookOpen className="h-3.5 w-3.5 text-indigo-500 flex-shrink-0" />
        <span className="font-mono text-xs text-indigo-700 dark:text-indigo-300 font-medium flex-shrink-0">
          {booking.bookingNumber}
        </span>
        <StatusBadge status={booking.status} />
        {booking.skipReason && (
          <span className="text-xs text-amber-600 truncate">{booking.skipReason}</span>
        )}
        {items.length > 0 && (
          <span className="ml-auto text-xs text-gray-400 flex-shrink-0">{items.length} Leistung{items.length !== 1 ? "en" : ""}</span>
        )}
      </button>

      {expanded && (
        <div className="border-t border-indigo-100 dark:border-indigo-900/50">
          {items.length > 0 && (
            <div className="divide-y divide-indigo-50 dark:divide-indigo-900/30">
              {items.map(item => <ItemRow key={item.id} item={item} />)}
            </div>
          )}
          {booking.rawData && (
            <div className="px-3 pb-3 pt-2">
              <div className="text-xs font-medium text-gray-400 mb-1">Rohdaten (BOS)</div>
              <RawDataView data={booking.rawData} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Customer group row (top-level, expandable) ──────────────────────────────
function CustomerGroupRow({ group }: { group: CustomerGroup }) {
  const [expanded, setExpanded] = useState(false);
  const { customer, bookings } = group;
  const totalItems = bookings.reduce((n, b) => n + b.items.length, 0);

  return (
    <div
      className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"
      data-testid={`customer-group-${customer.id}`}
    >
      {/* Customer header */}
      <button
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors text-left bg-white dark:bg-gray-900"
        onClick={() => setExpanded(!expanded)}
        data-testid={`customer-row-${customer.id}`}
      >
        <span className="text-gray-400 flex-shrink-0">
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </span>
        <User className="h-4 w-4 text-violet-500 flex-shrink-0" />
        <span className="font-semibold text-sm text-gray-900 dark:text-gray-100 flex-1">
          {customer.customerName || "–"}
        </span>
        <StatusBadge status={customer.status} />
        <span className="text-xs text-gray-400 font-mono flex-shrink-0">
          BOS #{customer.bosRef}
        </span>
        <span className="text-xs text-gray-400 flex-shrink-0 hidden sm:inline">
          {bookings.length} Buchung{bookings.length !== 1 ? "en" : ""} · {totalItems} Leistung{totalItems !== 1 ? "en" : ""}
        </span>
        <span className="text-xs text-gray-400 flex-shrink-0">
          {format(new Date(customer.runAt), "dd.MM.yy HH:mm", { locale: de })}
        </span>
      </button>

      {/* Expanded: customer details + bookings */}
      {expanded && (
        <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/20 px-4 py-3 space-y-2">
          {/* Customer detail fields */}
          {customer.rawData && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-500 pb-2">
              {customer.customerId && <div><span className="font-medium text-gray-400">Kunden-ID</span><div className="font-mono font-medium text-gray-700 dark:text-gray-300">{customer.customerId}</div></div>}
              {customer.rawData.email && <div><span className="font-medium text-gray-400">E-Mail</span><div className="truncate text-gray-700 dark:text-gray-300">{customer.rawData.email}</div></div>}
              {customer.rawData.nationality && <div><span className="font-medium text-gray-400">Land</span><div className="text-gray-700 dark:text-gray-300">{customer.rawData.nationality}</div></div>}
              {customer.rawData.kiteLevel && <div><span className="font-medium text-gray-400">Kite-Level</span><div className="text-gray-700 dark:text-gray-300">{customer.rawData.kiteLevel}</div></div>}
            </div>
          )}

          {/* Bookings */}
          {bookings.length > 0 && (
            <div className="space-y-2">
              {bookings.map(b => <BookingRow key={b.booking.id} group={b} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Orphan booking (no customer match, e.g. skipped) ───────────────────────
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

// ── Main page ───────────────────────────────────────────────────────────────
export default function BosImporterPage() {
  const { isSuperAdmin } = useAuth();
  const [selectedConfigId, setSelectedConfigId] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const { data: configs = [] } = useQuery<SchoolConfig[]>({
    queryKey: ["/api/school-configs"],
    enabled: !!isSuperAdmin,
  });

  const firstConfig = configs[0];
  const effectiveConfigId = selectedConfigId || (firstConfig ? String(firstConfig.id) : "");

  const { data: logs = [], isLoading, refetch, isFetching } = useQuery<BosImportLog[]>({
    queryKey: ["/api/bos-import-logs", effectiveConfigId],
    queryFn: async () => {
      if (!effectiveConfigId) return [];
      const res = await fetch(`/api/bos-import-logs/${effectiveConfigId}`);
      if (!res.ok) throw new Error("Fehler beim Laden der Logs");
      return res.json();
    },
    enabled: !!effectiveConfigId,
  });

  if (!isSuperAdmin) {
    return <div className="flex items-center justify-center min-h-[60vh]"><p className="text-gray-500">Kein Zugriff</p></div>;
  }

  const { groups, orphanBookings } = groupLogs(logs);

  const filteredGroups = filterStatus === "all"
    ? groups
    : groups.filter(g => g.customer.status === filterStatus);

  const customerLogs = logs.filter(l => l.recordType === "customer");
  const bookingLogs = logs.filter(l => l.recordType === "booking");
  const itemLogs = logs.filter(l => l.recordType === "booking_item");

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">BOS Importer</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Import-Protokoll für KiteWorldWide-Daten</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} data-testid="button-refresh-logs">
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
          Aktualisieren
        </Button>
      </div>

      {/* School selector */}
      {configs.length > 1 && (
        <Select value={effectiveConfigId} onValueChange={setSelectedConfigId}>
          <SelectTrigger className="w-56" data-testid="select-school-config">
            <SelectValue placeholder="Schule wählen" />
          </SelectTrigger>
          <SelectContent>
            {configs.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.stationName}</SelectItem>)}
          </SelectContent>
        </Select>
      )}

      {/* KPI cards */}
      {logs.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <Card className="border-violet-200 dark:border-violet-800">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-baseline justify-between mb-1">
                <div className="text-2xl font-bold text-violet-700 dark:text-violet-400">{customerLogs.length}</div>
                <span className="text-xs text-violet-500">Kunden</span>
              </div>
              <div className="flex gap-2 text-xs text-gray-500 flex-wrap">
                <span className="text-green-600">{customerLogs.filter(l => l.status === "created").length} neu</span>
                <span>·</span>
                <span className="text-blue-600">{customerLogs.filter(l => l.status === "updated").length} akt.</span>
                <span>·</span>
                <span>{customerLogs.filter(l => l.status === "unchanged").length} unbew.</span>
              </div>
            </CardContent>
          </Card>
          <Card className="border-indigo-200 dark:border-indigo-800">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-baseline justify-between mb-1">
                <div className="text-2xl font-bold text-indigo-700 dark:text-indigo-400">{bookingLogs.length}</div>
                <span className="text-xs text-indigo-500">Buchungen</span>
              </div>
              <div className="flex gap-2 text-xs text-gray-500 flex-wrap">
                <span className="text-green-600">{bookingLogs.filter(l => l.status === "created").length} neu</span>
                <span>·</span>
                <span className="text-blue-600">{bookingLogs.filter(l => l.status === "updated").length} akt.</span>
                <span>·</span>
                <span className="text-amber-600">{bookingLogs.filter(l => l.status === "skipped" || l.status === "deleted").length} übersp.</span>
              </div>
            </CardContent>
          </Card>
          <Card className="border-teal-200 dark:border-teal-800">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-baseline justify-between mb-1">
                <div className="text-2xl font-bold text-teal-700 dark:text-teal-400">{itemLogs.length}</div>
                <span className="text-xs text-teal-500">Leistungen</span>
              </div>
              <div className="flex gap-2 text-xs text-gray-500 flex-wrap">
                <span className="text-green-600">{itemLogs.filter(l => l.status === "created").length} neu</span>
                <span>·</span>
                <span className="text-blue-600">{itemLogs.filter(l => l.status === "updated").length} akt.</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Log table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-base">Import-Datensätze</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40 h-8 text-xs" data-testid="select-filter-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Kunden</SelectItem>
                  <SelectItem value="created">Nur neu erstellt</SelectItem>
                  <SelectItem value="updated">Nur aktualisiert</SelectItem>
                  <SelectItem value="unchanged">Nur unverändert</SelectItem>
                  <SelectItem value="skipped">Nur übersprungen</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-xs text-gray-500 whitespace-nowrap">{filteredGroups.length} Kunden</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          {isLoading ? (
            <div className="text-center py-12 text-gray-400">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p className="text-sm">Lade Logs…</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-sm">Noch keine Import-Datensätze vorhanden.</p>
            </div>
          ) : (
            <>
              {filteredGroups.map(group => (
                <CustomerGroupRow key={group.customer.id} group={group} />
              ))}
              {orphanBookings.map(b => (
                <OrphanBookingRow key={b.id} booking={b} />
              ))}
              {filteredGroups.length === 0 && orphanBookings.length === 0 && (
                <p className="text-sm text-center py-8 text-gray-400">Keine Einträge für diesen Filter.</p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
