import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeftRight, Check, X } from "lucide-react";
import type { Transfer, Station, Equipment } from "@shared/schema";

export default function TransfersPage() {
  const { toast } = useToast();
  const { isAdmin } = useAuth();

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

  const getStationName = (id: number) => stationsList?.find((s) => s.id === id)?.name || `Station ${id}`;
  const getEquipmentInfo = (id: number) => {
    const e = equipment?.find((eq) => eq.id === id);
    return e ? `${e.brand} ${e.model} (${e.serialNumber})` : `Equipment #${id}`;
  };

  const confirmMutation = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/transfers/${id}/confirm`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transfers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({ title: "Transfer confirmed" });
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

  const pending = transfers?.filter((t) => t.status === "pending") || [];
  const completed = transfers?.filter((t) => t.status !== "pending") || [];

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-4 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-32" />
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24" />)}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold tracking-tight" data-testid="text-transfers-title">
        Transfers
      </h1>

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
          {pending.length === 0 ? (
            <div className="text-center py-16">
              <ArrowLeftRight className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="font-medium">No pending transfers</h3>
              <p className="text-sm text-muted-foreground mt-1">All equipment is where it should be</p>
            </div>
          ) : (
            pending.map((t) => (
              <Card key={t.id} data-testid={`card-pending-transfer-${t.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{getEquipmentInfo(t.equipmentId)}</p>
                      <p className="text-sm text-muted-foreground">
                        {getStationName(t.fromStationId)} → {getStationName(t.toStationId)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Initiated: {t.initiatedAt ? new Date(t.initiatedAt).toLocaleDateString() : "N/A"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => confirmMutation.mutate(t.id)}
                        disabled={confirmMutation.isPending}
                        data-testid={`button-confirm-${t.id}`}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Confirm
                      </Button>
                      {isAdmin && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => cancelMutation.mutate(t.id)}
                          disabled={cancelMutation.isPending}
                          data-testid={`button-cancel-${t.id}`}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
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
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        t.status === "confirmed"
                          ? "bg-green-500/15 text-green-700 dark:text-green-400"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {t.status === "confirmed" ? "Confirmed" : "Cancelled"}
                      </span>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t.confirmedAt ? new Date(t.confirmedAt).toLocaleDateString() : t.initiatedAt ? new Date(t.initiatedAt).toLocaleDateString() : ""}
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
