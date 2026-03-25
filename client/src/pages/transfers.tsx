import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { BarcodeScanner } from "@/components/barcode-scanner";
import { ArrowLeftRight, ArrowLeft, Check, X, AlertTriangle, PackageCheck, ScanLine, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Transfer, Station, Equipment } from "@shared/schema";

interface ReceiveState {
  arrived: boolean | null;
  condition: number | null;
}

export default function TransfersPage() {
  const { toast } = useToast();
  const { isAdmin, user } = useAuth();

  const [receiveState, setReceiveState] = useState<Record<number, ReceiveState>>({});
  const [scannerOpen, setScannerOpen] = useState(false);
  const [highlightedId, setHighlightedId] = useState<number | null>(null);
  const cardRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const { data: transfers, isLoading } = useQuery<Transfer[]>({ queryKey: ["/api/transfers"] });
  const { data: stationsList } = useQuery<Station[]>({ queryKey: ["/api/stations"] });
  const { data: equipment } = useQuery<Equipment[]>({
    queryKey: ["/api/equipment"],
    queryFn: async () => {
      const res = await fetch("/api/equipment", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const getStationName = (id: number) => stationsList?.find((s) => s.id === id)?.name ?? `Station ${id}`;
  const getEquipmentInfo = (id: number) => {
    const e = equipment?.find((eq) => eq.id === id);
    return e ? `${e.brand} ${e.model} (${e.serialNumber})` : `Equipment #${id}`;
  };

  const confirmMutation = useMutation({
    mutationFn: ({ id, arrived, condition }: { id: number; arrived: boolean; condition?: number }) =>
      apiRequest("POST", `/api/transfers/${id}/confirm`, { arrived, condition }),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["/api/transfers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      setReceiveState((prev) => {
        const next = { ...prev };
        delete next[vars.id];
        return next;
      });
      setHighlightedId(null);
      toast({
        title: vars.arrived ? "Receipt confirmed" : "Item reported missing",
        description: vars.arrived
          ? `Equipment received in condition ${vars.condition}/5`
          : "Equipment marked as missing and admin has been notified.",
        variant: vars.arrived ? "default" : "destructive",
      });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/transfers/${id}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transfers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({ title: "Transfer cancelled" });
    },
  });

  const pending = transfers?.filter((t) => t.status === "pending") ?? [];
  const completed = transfers?.filter((t) => t.status !== "pending") ?? [];

  const canReceive = (t: Transfer) =>
    isAdmin || (user?.assignedStationId === t.toStationId);

  function setArrived(id: number, arrived: boolean) {
    setReceiveState((prev) => ({ ...prev, [id]: { arrived, condition: null } }));
  }

  function setCondition(id: number, condition: number) {
    setReceiveState((prev) => ({ ...prev, [id]: { ...prev[id], condition } }));
  }

  function submitReceipt(t: Transfer) {
    const state = receiveState[t.id];
    if (!state || state.arrived === null) return;
    if (state.arrived && !state.condition) return;
    confirmMutation.mutate({
      id: t.id,
      arrived: state.arrived,
      condition: state.condition ?? undefined,
    });
  }

  const handleScan = useCallback((code: string) => {
    const eq = equipment?.find((e) => e.serialNumber === code);

    if (!eq) {
      toast({
        title: "Serial number not found",
        description: (
          <div className="space-y-2">
            <p>No equipment matches <strong>{code}</strong>.</p>
            <Link href={`/equipment?search=${encodeURIComponent(code)}`}>
              <button className="underline text-sm">Search manually →</button>
            </Link>
          </div>
        ) as any,
        variant: "destructive",
      });
      return;
    }

    const transfer = pending.find((t) => t.equipmentId === eq.id && canReceive(t));

    if (!transfer) {
      toast({
        title: "Not in an incoming transfer",
        description: (
          <div className="space-y-2">
            <p><strong>{eq.brand} {eq.model}</strong> is not in a pending transfer for your station.</p>
            <Link href={`/equipment/${eq.id}`}>
              <button className="underline text-sm">View equipment →</button>
            </Link>
          </div>
        ) as any,
        variant: "destructive",
      });
      return;
    }

    // Auto-open the receive form with "arrived" pre-selected
    setReceiveState((prev) => ({
      ...prev,
      [transfer.id]: { arrived: true, condition: null },
    }));
    setHighlightedId(transfer.id);

    // Scroll to the card
    setTimeout(() => {
      cardRefs.current[transfer.id]?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);

    toast({
      title: `${eq.brand} ${eq.model} found`,
      description: "Now rate the condition on arrival.",
    });
  }, [equipment, pending, canReceive, toast]);

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-4 max-w-5xl mx-auto">
        <Skeleton className="h-8 w-32" />
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24" />)}
      </div>
    );
  }

  const hasReceivable = pending.some(canReceive);

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-5xl mx-auto">
      <div className="flex items-center gap-2">
        <Link href="/">
          <Button variant="ghost" size="icon" className="h-8 w-8" data-testid="button-back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-transfers-title">
          Transfers
        </h1>
      </div>

      <BarcodeScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleScan}
      />

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending" data-testid="tab-pending-transfers">
            Pending {pending.length > 0 && `(${pending.length})`}
          </TabsTrigger>
          <TabsTrigger value="history" data-testid="tab-transfer-history">
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4 space-y-3">
          {/* Scan to Receive button — only when there are receivable transfers */}
          {hasReceivable && pending.length > 0 && (
            <Button
              variant="outline"
              className="w-full gap-2 border-primary/40 text-primary hover:bg-primary/5"
              onClick={() => setScannerOpen(true)}
              data-testid="button-scan-to-receive"
            >
              <ScanLine className="h-4 w-4" />
              Scan to Receive
            </Button>
          )}

          {pending.length === 0 ? (
            <div className="text-center py-16">
              <ArrowLeftRight className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="font-medium">No pending transfers</h3>
              <p className="text-sm text-muted-foreground mt-1">All equipment is where it should be</p>
            </div>
          ) : (
            pending.map((t) => {
              const state = receiveState[t.id] ?? { arrived: null, condition: null };
              const receivable = canReceive(t);
              const isPending = confirmMutation.isPending && confirmMutation.variables?.id === t.id;
              const isHighlighted = highlightedId === t.id;

              return (
                <div
                  key={t.id}
                  ref={(el) => { cardRefs.current[t.id] = el; }}
                >
                  <Card
                    className={cn(
                      "transition-all duration-500",
                      isHighlighted && "ring-2 ring-primary shadow-md"
                    )}
                    data-testid={`card-pending-transfer-${t.id}`}
                  >
                    <CardContent className="p-4 space-y-4">
                      {/* Scanned indicator */}
                      {isHighlighted && (
                        <div className="flex items-center gap-2 text-xs font-medium text-primary">
                          <ScanLine className="h-3.5 w-3.5" />
                          Scanned — confirm condition below
                        </div>
                      )}

                      {/* Transfer info row */}
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="space-y-1">
                          <p className="font-medium text-sm">{getEquipmentInfo(t.equipmentId)}</p>
                          <p className="text-sm text-muted-foreground">
                            {getStationName(t.fromStationId)} → {getStationName(t.toStationId)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Sent: {t.initiatedAt ? new Date(t.initiatedAt).toLocaleDateString() : "N/A"}
                          </p>
                        </div>
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => cancelMutation.mutate(t.id)}
                            disabled={cancelMutation.isPending}
                            className="text-muted-foreground"
                            data-testid={`button-cancel-${t.id}`}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Cancel
                          </Button>
                        )}
                      </div>

                      {/* Receive checklist — only for receiving station or admin */}
                      {receivable && (
                        <div className="border-t pt-3 space-y-3">
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Confirm Receipt
                          </p>

                          {/* Arrived? */}
                          <div className="flex gap-2">
                            <button
                              onClick={() => setArrived(t.id, true)}
                              className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition-colors",
                                state.arrived === true
                                  ? "bg-green-500/15 border-green-500/40 text-green-700 dark:text-green-400"
                                  : "border-border hover:bg-accent/50 text-muted-foreground"
                              )}
                              data-testid={`button-arrived-${t.id}`}
                            >
                              <PackageCheck className="h-4 w-4" />
                              Arrived
                            </button>
                            <button
                              onClick={() => setArrived(t.id, false)}
                              className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition-colors",
                                state.arrived === false
                                  ? "bg-red-500/15 border-red-500/40 text-red-700 dark:text-red-400"
                                  : "border-border hover:bg-accent/50 text-muted-foreground"
                              )}
                              data-testid={`button-missing-${t.id}`}
                            >
                              <AlertTriangle className="h-4 w-4" />
                              Not arrived
                            </button>
                          </div>

                          {/* Condition stars — only if arrived */}
                          {state.arrived === true && (
                            <div className="space-y-1.5">
                              <p className="text-xs text-muted-foreground">Condition on arrival</p>
                              <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map((r) => (
                                  <button
                                    key={r}
                                    onClick={() => setCondition(t.id, r)}
                                    className={cn(
                                      "flex-1 py-2.5 rounded-lg border text-sm font-bold transition-colors",
                                      state.condition === r
                                        ? r >= 4
                                          ? "bg-green-500/15 border-green-500/40 text-green-700 dark:text-green-400"
                                          : r === 3
                                          ? "bg-yellow-500/15 border-yellow-500/40 text-yellow-700 dark:text-yellow-400"
                                          : "bg-red-500/15 border-red-500/40 text-red-700 dark:text-red-400"
                                        : "border-border hover:bg-accent/50 text-muted-foreground"
                                    )}
                                    data-testid={`button-condition-${r}-${t.id}`}
                                  >
                                    {r}★
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Missing warning */}
                          {state.arrived === false && (
                            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-700 dark:text-red-400">
                              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                              <span>The item will be marked as <strong>missing</strong>. The admin will be notified.</span>
                            </div>
                          )}

                          {/* Submit button */}
                          {state.arrived !== null && (state.arrived === false || state.condition !== null) && (
                            <Button
                              className={cn(
                                "w-full",
                                state.arrived === false && "bg-red-600 hover:bg-red-700 text-white"
                              )}
                              onClick={() => submitReceipt(t)}
                              disabled={isPending}
                              data-testid={`button-confirm-receipt-${t.id}`}
                            >
                              {isPending ? (
                                "Saving…"
                              ) : state.arrived ? (
                                <>
                                  <Check className="h-4 w-4 mr-2" />
                                  Confirm Receipt
                                </>
                              ) : (
                                <>
                                  <AlertTriangle className="h-4 w-4 mr-2" />
                                  Report as Missing
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      )}

                      {/* Non-receivable notice */}
                      {!receivable && (
                        <p className="text-xs text-muted-foreground border-t pt-3">
                          Awaiting confirmation from {getStationName(t.toStationId)}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4 space-y-3">
          {completed.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">No transfer history</p>
          ) : (
            completed.map((t) => (
              <Card key={t.id} data-testid={`card-transfer-history-${t.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-1">
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{getEquipmentInfo(t.equipmentId)}</p>
                      <p className="text-sm text-muted-foreground">
                        {getStationName(t.fromStationId)} → {getStationName(t.toStationId)}
                      </p>
                      {t.arrivedCondition && (
                        <p className="text-xs text-muted-foreground">
                          Received in condition {t.arrivedCondition}/5
                        </p>
                      )}
                    </div>
                    <div className="text-right space-y-1">
                      {t.status === "confirmed" && t.missing ? (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-500/15 text-red-700 dark:text-red-400">
                          Missing
                        </span>
                      ) : t.status === "confirmed" ? (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-500/15 text-green-700 dark:text-green-400">
                          Received
                        </span>
                      ) : (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          Cancelled
                        </span>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {t.confirmedAt
                          ? new Date(t.confirmedAt).toLocaleDateString()
                          : t.initiatedAt
                          ? new Date(t.initiatedAt).toLocaleDateString()
                          : ""}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
