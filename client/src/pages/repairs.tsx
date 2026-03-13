import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Wrench, CheckCircle, AlertTriangle, MapPin, ExternalLink,
  Info, ChevronDown, ChevronUp, User, Calendar, Package,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface ActiveRepairItem {
  repairId: number;
  repairDescription: string;
  repairStatus: string;
  repairDate: string | null;
  repairCost: string | null;
  loggedByName: string;
  equipmentId: number;
  equipmentSerial: string;
  equipmentBrand: string;
  equipmentModel: string;
  equipmentType: string;
  stationId: number | null;
  stationName: string | null;
  damageReportId: number | null;
  damageReportStatus: string | null;
  damageReportedAt: string | null;
  estimatedRepairCost: string | null;
  estimatedValueLoss: string | null;
  sparePartsNeeded: string | null;
  needsSpareParts: boolean;
  customerName: string | null;
  bookingReference: string | null;
  usageType: string | null;
  repairable: boolean;
  totalLoss: boolean;
}

function formatIncidentNumber(id: number, reportedAt: string | null): string {
  const year = reportedAt ? new Date(reportedAt).getFullYear() : new Date().getFullYear();
  return `DR-${year}-${String(id).padStart(3, "0")}`;
}

function fmt(date: string | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

const USAGE_LABELS: Record<string, string> = {
  rental: "Rental", lesson: "Lesson", own_use: "Own Use", demo: "Demo",
};

function CompleteRepairDialog({ item, onClose }: { item: ActiveRepairItem; onClose: () => void }) {
  const { toast } = useToast();
  const [actualCost, setActualCost] = useState("");
  const [notes, setNotes] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", `/api/repairs/${item.repairId}/complete`, {
        actualCost: actualCost || null,
        notes: notes || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/repairs/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      queryClient.invalidateQueries({ queryKey: ["/api/damage-reports"] });
      queryClient.invalidateQueries({ queryKey: ["/api/damage-reports/open-count"] });
      toast({ title: "Repair completed", description: `${item.equipmentBrand} ${item.equipmentModel} is back in the active pool.` });
      onClose();
    },
    onError: () => toast({ title: "Error", description: "Failed to complete repair.", variant: "destructive" }),
  });

  const estimated = item.estimatedRepairCost ? parseFloat(item.estimatedRepairCost) : null;
  const actual = actualCost ? parseFloat(actualCost) : null;
  const diff = estimated !== null && actual !== null ? actual - estimated : null;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Complete Repair
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="rounded-lg border bg-muted/40 p-3 space-y-1">
            {item.damageReportId && (
              <p className="text-xs font-semibold text-muted-foreground">
                {formatIncidentNumber(item.damageReportId, item.damageReportedAt)}
              </p>
            )}
            <p className="font-medium text-sm">{item.equipmentBrand} {item.equipmentModel}</p>
            <p className="text-xs text-muted-foreground">{item.equipmentSerial}</p>
            {item.stationName && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />{item.stationName}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="actual-cost" className="text-sm font-medium">Actual repair cost (€)</Label>
            {estimated !== null && (
              <p className="text-xs text-muted-foreground">
                Estimated: <span className="font-medium text-foreground">€{estimated.toFixed(2)}</span>
              </p>
            )}
            <Input
              id="actual-cost"
              type="number"
              step="0.01"
              min="0"
              placeholder="e.g. 180.00"
              value={actualCost}
              onChange={e => setActualCost(e.target.value)}
              data-testid="input-actual-cost"
            />
            {diff !== null && (
              <p className={`text-xs font-medium ${diff > 0 ? "text-red-600" : diff < 0 ? "text-green-600" : "text-muted-foreground"}`}>
                {diff > 0 ? `+€${diff.toFixed(2)} over estimate` : diff < 0 ? `-€${Math.abs(diff).toFixed(2)} under estimate` : "Matches estimate"}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="completion-notes" className="text-sm font-medium">
              Completion notes <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Textarea
              id="completion-notes"
              placeholder="What was done, parts replaced, etc."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              data-testid="textarea-completion-notes"
            />
          </div>

          {item.damageReportId && (
            <div className="flex items-start gap-2 rounded-md bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-3 text-xs text-blue-700 dark:text-blue-300">
              <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>Damage Report {formatIncidentNumber(item.damageReportId, item.damageReportedAt)} will be automatically closed.</span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={mutation.isPending} data-testid="button-cancel-complete">
            Cancel
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="bg-green-600 hover:bg-green-700 text-white"
            data-testid="button-confirm-complete"
          >
            {mutation.isPending ? "Completing…" : "Mark as Completed"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function IncidentRepairCard({ item, onComplete }: { item: ActiveRepairItem; onComplete: (item: ActiveRepairItem) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="border rounded-lg overflow-hidden"
      data-testid={`card-incident-repair-${item.repairId}`}
    >
      <button
        className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-muted/30 transition-colors"
        onClick={() => setOpen(v => !v)}
        data-testid={`accordion-toggle-${item.repairId}`}
      >
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded">
              {formatIncidentNumber(item.damageReportId!, item.damageReportedAt)}
            </span>
            {item.needsSpareParts && (
              <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 text-[10px] h-5 px-1.5">
                <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />Spare Parts
              </Badge>
            )}
            {item.totalLoss && (
              <Badge variant="destructive" className="text-[10px] h-5 px-1.5">Total Loss</Badge>
            )}
            <Badge variant="outline" className="text-[10px] h-5 px-1.5 capitalize">
              {item.usageType ? USAGE_LABELS[item.usageType] ?? item.usageType : "—"}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            {item.stationName && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3 shrink-0" />
                {item.stationName}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3 shrink-0" />
              {fmt(item.damageReportedAt)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-sm">
            <Package className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="font-medium">{item.equipmentBrand} {item.equipmentModel}</span>
            <span className="text-muted-foreground text-xs">· {item.equipmentSerial}</span>
          </div>
        </div>
        <span className="text-muted-foreground mt-0.5 shrink-0">
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </span>
      </button>

      {open && (
        <div className="border-t px-4 py-4 space-y-4 bg-muted/20">
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">How it happened</p>
            <p className="text-sm">{item.repairDescription}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            {item.estimatedRepairCost && (
              <div className="rounded-md border bg-background px-3 py-2">
                <p className="text-muted-foreground mb-0.5">Est. Repair Cost</p>
                <p className="font-semibold text-base">€{parseFloat(item.estimatedRepairCost).toFixed(2)}</p>
              </div>
            )}
            {item.estimatedValueLoss && (
              <div className="rounded-md border bg-background px-3 py-2">
                <p className="text-muted-foreground mb-0.5">Est. Value Loss</p>
                <p className="font-semibold text-base">€{parseFloat(item.estimatedValueLoss).toFixed(2)}</p>
              </div>
            )}
          </div>

          {item.needsSpareParts && item.sparePartsNeeded && (
            <div className="rounded-md border border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800 px-3 py-2">
              <p className="text-xs font-semibold text-orange-700 dark:text-orange-400 mb-1 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />Spare parts needed
              </p>
              <p className="text-xs text-orange-600 dark:text-orange-300">{item.sparePartsNeeded}</p>
            </div>
          )}

          {(item.customerName || item.bookingReference) && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
              {item.customerName && (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <User className="h-3 w-3" />
                  <span className="font-medium text-foreground">{item.customerName}</span>
                </span>
              )}
              {item.bookingReference && (
                <span className="text-muted-foreground">
                  Booking: <span className="font-medium text-foreground">{item.bookingReference}</span>
                </span>
              )}
            </div>
          )}

          <div className="text-xs text-muted-foreground">
            Logged by <span className="font-medium text-foreground">{item.loggedByName}</span>
            {item.repairDate && <span> on {fmt(item.repairDate)}</span>}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Link href={`/equipment/${item.equipmentId}`}>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1" data-testid={`link-equipment-${item.equipmentId}`}>
                <ExternalLink className="h-3 w-3" />
                View Equipment
              </Button>
            </Link>
            <Link href="/incidents">
              <Button variant="outline" size="sm" className="h-8 text-xs" data-testid={`link-incident-${item.damageReportId}`}>
                Incident #{item.damageReportId}
              </Button>
            </Link>
            <Button
              size="sm"
              className="h-8 text-xs ml-auto bg-green-600 hover:bg-green-700 text-white gap-1"
              onClick={e => { e.stopPropagation(); onComplete(item); }}
              data-testid={`button-complete-repair-${item.repairId}`}
            >
              <Wrench className="h-3 w-3" />
              Complete Repair
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function StandaloneRepairCard({ item, onComplete }: { item: ActiveRepairItem; onComplete: (item: ActiveRepairItem) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="border rounded-lg overflow-hidden"
      data-testid={`card-standalone-repair-${item.repairId}`}
    >
      <button
        className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-muted/30 transition-colors"
        onClick={() => setOpen(v => !v)}
      >
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-1.5 text-sm">
            <span className="font-medium">{item.equipmentBrand} {item.equipmentModel}</span>
            <span className="text-muted-foreground text-xs">· {item.equipmentSerial}</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            {item.stationName && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />{item.stationName}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />{fmt(item.repairDate)}
            </span>
            <span>By {item.loggedByName}</span>
          </div>
        </div>
        <span className="text-muted-foreground mt-0.5 shrink-0">
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </span>
      </button>

      {open && (
        <div className="border-t px-4 py-4 space-y-4 bg-muted/20">
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Repair description</p>
            <p className="text-sm">{item.repairDescription}</p>
          </div>

          {item.repairCost && (
            <div className="rounded-md border bg-background px-3 py-2 text-xs inline-block">
              <p className="text-muted-foreground mb-0.5">Estimated Cost</p>
              <p className="font-semibold text-base">€{parseFloat(item.repairCost).toFixed(2)}</p>
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <Link href={`/equipment/${item.equipmentId}`}>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
                <ExternalLink className="h-3 w-3" />
                View Equipment
              </Button>
            </Link>
            <Button
              size="sm"
              className="h-8 text-xs ml-auto bg-green-600 hover:bg-green-700 text-white gap-1"
              onClick={e => { e.stopPropagation(); onComplete(item); }}
              data-testid={`button-complete-standalone-${item.repairId}`}
            >
              <Wrench className="h-3 w-3" />
              Complete Repair
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RepairsPage() {
  const [completing, setCompleting] = useState<ActiveRepairItem | null>(null);

  const { data: items, isLoading } = useQuery<ActiveRepairItem[]>({
    queryKey: ["/api/repairs/active"],
    staleTime: 0,
  });

  const incidents = items?.filter(i => i.damageReportId !== null) ?? [];
  const standalone = items?.filter(i => i.damageReportId === null) ?? [];
  const total = items?.length ?? 0;

  return (
    <div className="space-y-6 px-1">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Wrench className="h-6 w-6" />
            Repairs
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Active repairs across all stations</p>
        </div>
        {!isLoading && items && total > 0 && (
          <Badge variant="secondary" className="text-sm px-3 py-1">
            {total} item{total !== 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
        </div>
      ) : total === 0 ? (
        <div className="text-center py-20">
          <CheckCircle className="h-12 w-12 mx-auto text-green-500/60 mb-4" />
          <h3 className="font-medium text-lg">All clear!</h3>
          <p className="text-muted-foreground text-sm mt-1">No equipment currently in repair.</p>
        </div>
      ) : (
        <>
          {incidents.length > 0 && (
            <section className="space-y-2">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-foreground">Damage Incidents</h2>
                <Badge variant="secondary" className="text-xs">{incidents.length}</Badge>
              </div>
              <div className="space-y-2">
                {incidents.map(item => (
                  <IncidentRepairCard key={item.repairId} item={item} onComplete={setCompleting} />
                ))}
              </div>
            </section>
          )}

          {standalone.length > 0 && (
            <section className="space-y-2">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-foreground">Standalone Repairs</h2>
                <Badge variant="secondary" className="text-xs">{standalone.length}</Badge>
              </div>
              <div className="space-y-2">
                {standalone.map(item => (
                  <StandaloneRepairCard key={item.repairId} item={item} onComplete={setCompleting} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {completing && (
        <CompleteRepairDialog item={completing} onClose={() => setCompleting(null)} />
      )}
    </div>
  );
}
