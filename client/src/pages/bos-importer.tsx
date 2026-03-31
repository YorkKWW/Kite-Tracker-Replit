import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, ChevronRight, CheckCircle2, RefreshCw, AlertCircle, Clock, Trash2, ArrowUpDown } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

type BosImportLog = {
  id: number;
  schoolConfigId: number;
  runAt: string;
  bosRef: string;
  bosVersion: string | null;
  recordType: "customer" | "booking";
  status: "created" | "updated" | "unchanged" | "deleted" | "skipped" | "error";
  skipReason: string | null;
  customerId: number | null;
  bookingId: number | null;
  customerName: string | null;
  bookingNumber: string | null;
  rawData: Record<string, any> | null;
};

type SchoolConfig = {
  id: number;
  stationName: string;
};

const STATUS_CONFIG: Record<BosImportLog["status"], { label: string; color: string; icon: typeof CheckCircle2 }> = {
  created: { label: "Neu erstellt", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800", icon: CheckCircle2 },
  updated: { label: "Aktualisiert", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800", icon: ArrowUpDown },
  unchanged: { label: "Unverändert", color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700", icon: Clock },
  deleted: { label: "Gelöscht", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800", icon: Trash2 },
  skipped: { label: "Übersprungen", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800", icon: AlertCircle },
  error: { label: "Fehler", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800", icon: AlertCircle },
};

function StatusBadge({ status }: { status: BosImportLog["status"] }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${cfg.color}`}>
      {status === "created" && <CheckCircle2 className="h-3 w-3" />}
      {status === "updated" && <ArrowUpDown className="h-3 w-3" />}
      {status === "unchanged" && <Clock className="h-3 w-3" />}
      {status === "deleted" && <Trash2 className="h-3 w-3" />}
      {(status === "skipped" || status === "error") && <AlertCircle className="h-3 w-3" />}
      {cfg.label}
    </span>
  );
}

function RecordTypeBadge({ type }: { type: BosImportLog["recordType"] }) {
  return (
    <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full border font-medium ${
      type === "customer"
        ? "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400 border-violet-200 dark:border-violet-800"
        : "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800"
    }`}>
      {type === "customer" ? "Kunde" : "Buchung"}
    </span>
  );
}

function RawDataView({ data }: { data: Record<string, any> }) {
  return (
    <pre className="text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded p-3 overflow-x-auto max-h-64 whitespace-pre-wrap break-words">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

function LogRow({ log }: { log: BosImportLog }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <button
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left"
        onClick={() => setExpanded(!expanded)}
        data-testid={`log-row-${log.id}`}
      >
        <span className="text-gray-400 flex-shrink-0">
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </span>

        <span className="text-xs text-gray-500 dark:text-gray-400 w-36 flex-shrink-0 font-mono">
          {format(new Date(log.runAt), "dd.MM.yy HH:mm:ss", { locale: de })}
        </span>

        <RecordTypeBadge type={log.recordType} />
        <StatusBadge status={log.status} />

        <span className="flex-1 min-w-0">
          <span className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate block">
            {log.customerName || "–"}
          </span>
          {log.bookingNumber && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Buchung: {log.bookingNumber}
            </span>
          )}
        </span>

        <span className="text-xs text-gray-400 font-mono flex-shrink-0">
          BOS #{log.bosRef}
          {log.bosVersion && <span className="ml-1">v{log.bosVersion}</span>}
        </span>
      </button>

      {expanded && (
        <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-4 bg-gray-50 dark:bg-gray-900/50 space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            {log.customerId && (
              <div>
                <div className="text-xs text-gray-500 mb-0.5">Kunden-ID</div>
                <div className="font-mono font-medium">{log.customerId}</div>
              </div>
            )}
            {log.bookingId && (
              <div>
                <div className="text-xs text-gray-500 mb-0.5">Buchungs-ID</div>
                <div className="font-mono font-medium">{log.bookingId}</div>
              </div>
            )}
            {log.bookingNumber && (
              <div>
                <div className="text-xs text-gray-500 mb-0.5">Buchungsnr.</div>
                <div className="font-mono font-medium">{log.bookingNumber}</div>
              </div>
            )}
            <div>
              <div className="text-xs text-gray-500 mb-0.5">BOS Ref.</div>
              <div className="font-mono font-medium">{log.bosRef}{log.bosVersion ? ` v${log.bosVersion}` : ""}</div>
            </div>
          </div>

          {log.skipReason && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-medium text-amber-800 dark:text-amber-400 mb-0.5">Grund</div>
                <div className="text-sm text-amber-700 dark:text-amber-300">{log.skipReason}</div>
              </div>
            </div>
          )}

          {log.rawData && (
            <div>
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Rohdaten (BOS)</div>
              <RawDataView data={log.rawData} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function BosImporterPage() {
  const { isSuperAdmin } = useAuth();
  const [selectedConfigId, setSelectedConfigId] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

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
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-500">Kein Zugriff</p>
      </div>
    );
  }

  const filtered = logs.filter(l => {
    if (filterStatus !== "all" && l.status !== filterStatus) return false;
    if (filterType !== "all" && l.recordType !== filterType) return false;
    return true;
  });

  const summary = {
    created: logs.filter(l => l.status === "created").length,
    updated: logs.filter(l => l.status === "updated").length,
    skipped: logs.filter(l => l.status === "skipped" || l.status === "error").length,
    unchanged: logs.filter(l => l.status === "unchanged").length,
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">BOS Importer</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Import-Protokoll für KiteWorldWide-Daten</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          data-testid="button-refresh-logs"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
          Aktualisieren
        </Button>
      </div>

      {configs.length > 1 && (
        <Select value={effectiveConfigId} onValueChange={setSelectedConfigId}>
          <SelectTrigger className="w-56" data-testid="select-school-config">
            <SelectValue placeholder="Schule wählen" />
          </SelectTrigger>
          <SelectContent>
            {configs.map(c => (
              <SelectItem key={c.id} value={String(c.id)}>{c.stationName}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {logs.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="border-green-200 dark:border-green-800">
            <CardContent className="pt-4 pb-3">
              <div className="text-2xl font-bold text-green-700 dark:text-green-400">{summary.created}</div>
              <div className="text-xs text-gray-500 mt-0.5">Neu erstellt</div>
            </CardContent>
          </Card>
          <Card className="border-blue-200 dark:border-blue-800">
            <CardContent className="pt-4 pb-3">
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">{summary.updated}</div>
              <div className="text-xs text-gray-500 mt-0.5">Aktualisiert</div>
            </CardContent>
          </Card>
          <Card className="border-amber-200 dark:border-amber-800">
            <CardContent className="pt-4 pb-3">
              <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">{summary.skipped}</div>
              <div className="text-xs text-gray-500 mt-0.5">Übersprungen / Fehler</div>
            </CardContent>
          </Card>
          <Card className="border-gray-200 dark:border-gray-700">
            <CardContent className="pt-4 pb-3">
              <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">{summary.unchanged}</div>
              <div className="text-xs text-gray-500 mt-0.5">Unverändert</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-base">Import-Log</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-32 h-8 text-xs" data-testid="select-filter-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Typen</SelectItem>
                  <SelectItem value="customer">Kunden</SelectItem>
                  <SelectItem value="booking">Buchungen</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-36 h-8 text-xs" data-testid="select-filter-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Status</SelectItem>
                  <SelectItem value="created">Neu erstellt</SelectItem>
                  <SelectItem value="updated">Aktualisiert</SelectItem>
                  <SelectItem value="skipped">Übersprungen</SelectItem>
                  <SelectItem value="error">Fehler</SelectItem>
                  <SelectItem value="unchanged">Unverändert</SelectItem>
                  <SelectItem value="deleted">Gelöscht</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-xs text-gray-500 whitespace-nowrap">{filtered.length} Einträge</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading ? (
            <div className="text-center py-12 text-gray-400">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p className="text-sm">Lade Logs…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-sm">
                {logs.length === 0 ? "Noch keine Import-Einträge vorhanden." : "Keine Einträge für diesen Filter."}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(log => (
                <LogRow key={log.id} log={log} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
