import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Wrench, CheckCircle, AlertTriangle, MapPin, ExternalLink, Info, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";

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
  estimatedRepairCost: string | null;
  sparePartsNeeded: string | null;
  needsSpareParts: boolean;
  customerName: string | null;
  bookingReference: string | null;
}

const TYPE_LABELS: Record<string, string> = {
  kite: "Kite", board: "Board", foilboard: "Foilboard", wing: "Wing",
  bar_lines: "Bar & Lines", wetsuit: "Wetsuit", harness: "Harness",
  helmet_safety: "Helmet / Safety", foil: "Foil",
};

function CompleteRepairDialog({
  item,
  onClose,
}: {
  item: ActiveRepairItem;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [actualCost, setActualCost] = useState("");
  const [notes, setNotes] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", `/api/repairs/${item.repairId}/complete`, {
        actualCost: actualCost ? actualCost : null,
        notes: notes || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/repairs/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      queryClient.invalidateQueries({ queryKey: ["/api/damage-reports"] });
      queryClient.invalidateQueries({ queryKey: ["/api/damage-reports/open-count"] });
      toast({ title: "Repair completed", description: `${item.equipmentBrand} ${item.equipmentModel} is back in the pool.` });
      onClose();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to complete repair.", variant: "destructive" });
    },
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

        <div className="space-y-4 py-2">
          <div className="rounded-lg border bg-muted/40 p-3 space-y-1">
            <p className="font-medium text-sm">{item.equipmentBrand} {item.equipmentModel}</p>
            <p className="text-xs text-muted-foreground">{item.equipmentSerial}</p>
            {item.stationName && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />{item.stationName}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1 italic">"{item.repairDescription}"</p>
          </div>

          {item.needsSpareParts && item.sparePartsNeeded && (
            <div className="rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800 p-3">
              <p className="text-xs font-semibold text-orange-700 dark:text-orange-400 mb-1 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Spare parts needed
              </p>
              <p className="text-xs text-orange-600 dark:text-orange-300">{item.sparePartsNeeded}</p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="actual-cost" className="text-sm font-medium">Actual repair cost (€)</Label>
            {estimated !== null && (
              <p className="text-xs text-muted-foreground">Estimated: <span className="font-medium">€{estimated.toFixed(2)}</span></p>
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
            <Label htmlFor="completion-notes" className="text-sm font-medium">Completion notes <span className="text-muted-foreground font-normal">(optional)</span></Label>
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
              <span>The linked Damage Report #{item.damageReportId} will be automatically closed.</span>
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

export default function RepairsPage() {
  const { user } = useAuth();
  const [completing, setCompleting] = useState<ActiveRepairItem | null>(null);

  const { data: items, isLoading } = useQuery<ActiveRepairItem[]>({
    queryKey: ["/api/repairs/active"],
    staleTime: 0,
  });

  return (
    <div className="space-y-4 px-1">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Repairs</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Equipment currently in repair</p>
        </div>
        {!isLoading && items && (
          <Badge variant="secondary" className="text-sm px-3 py-1">
            {items.length} item{items.length !== 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-lg" />)}
        </div>
      ) : !items?.length ? (
        <div className="text-center py-20">
          <CheckCircle className="h-12 w-12 mx-auto text-green-500/60 mb-4" />
          <h3 className="font-medium text-lg">All clear!</h3>
          <p className="text-muted-foreground text-sm mt-1">No equipment currently in repair.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <Card key={item.repairId} className="overflow-hidden" data-testid={`card-repair-${item.repairId}`}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-base truncate">{item.equipmentBrand} {item.equipmentModel}</span>
                      <Badge variant="outline" className="text-xs shrink-0">{TYPE_LABELS[item.equipmentType] ?? item.equipmentType}</Badge>
                      {item.needsSpareParts && (
                        <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 text-xs shrink-0">
                          <AlertTriangle className="h-2.5 w-2.5 mr-1" />Spare Parts
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.equipmentSerial}</p>
                  </div>
                  <Link href={`/equipment/${item.equipmentId}`}>
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" data-testid={`link-equipment-${item.equipmentId}`}>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>

                {item.stationName && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {item.stationName}
                  </div>
                )}

                <div className="rounded-md bg-muted/50 px-3 py-2">
                  <p className="text-xs font-medium text-muted-foreground mb-0.5">Repair description</p>
                  <p className="text-sm">{item.repairDescription}</p>
                </div>

                {item.needsSpareParts && item.sparePartsNeeded && (
                  <div className="rounded-md border border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800 px-3 py-2">
                    <p className="text-xs font-semibold text-orange-700 dark:text-orange-400 mb-0.5 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> Spare parts needed
                    </p>
                    <p className="text-xs text-orange-600 dark:text-orange-300">{item.sparePartsNeeded}</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {item.estimatedRepairCost && (
                    <span>Estimated: <span className="font-medium text-foreground">€{parseFloat(item.estimatedRepairCost).toFixed(2)}</span></span>
                  )}
                  {item.customerName && (
                    <span>Customer: <span className="font-medium text-foreground">{item.customerName}</span></span>
                  )}
                  {item.bookingReference && (
                    <span>Ref: <span className="font-medium text-foreground">{item.bookingReference}</span></span>
                  )}
                  {item.repairDate && (
                    <span>Logged: <span className="font-medium text-foreground">{new Date(item.repairDate).toLocaleDateString()}</span></span>
                  )}
                  <span>By: <span className="font-medium text-foreground">{item.loggedByName}</span></span>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  {item.damageReportId && (
                    <Link href="/incidents">
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1" data-testid={`link-damage-report-${item.damageReportId}`}>
                        Incident #{item.damageReportId}
                        <ChevronRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  )}
                  <Button
                    size="sm"
                    className="h-7 text-xs ml-auto bg-green-600 hover:bg-green-700 text-white gap-1"
                    onClick={() => setCompleting(item)}
                    data-testid={`button-complete-repair-${item.repairId}`}
                  >
                    <Wrench className="h-3 w-3" />
                    Complete Repair
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {completing && (
        <CompleteRepairDialog item={completing} onClose={() => setCompleting(null)} />
      )}
    </div>
  );
}
