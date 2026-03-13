import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Plus, Minus, ArrowRightLeft, Trash2, Loader2, HardHat, AlertTriangle, Check, X } from "lucide-react";
import type { Station } from "@shared/schema";
import { ACCESSORY_SIZES } from "@shared/schema";

type AccessoryCategory = {
  id: number;
  name: string;
  hasSizes: boolean;
  isDefault: boolean;
};

type AccessoryInventory = {
  id: number;
  categoryId: number;
  stationId: number;
  size: string;
  quantity: number;
};

type AccessoryTransfer = {
  id: number;
  categoryId: number;
  size: string;
  quantity: number;
  fromStationId: number;
  toStationId: number;
  transferredBy: number | null;
  transferredAt: string;
  categoryName: string;
  fromStationName: string;
  toStationName: string;
  transferredByName: string | null;
};

type LossReport = {
  id: number;
  categoryId: number;
  stationId: number;
  size: string;
  quantity: number;
  reason: string;
  reportedBy: number;
  reportedAt: string;
  status: string;
  resolvedBy: number | null;
  resolvedAt: string | null;
  adminNote: string | null;
  categoryName: string;
  stationName: string;
  reportedByName: string;
  resolvedByName: string | null;
};

export default function AccessoriesPage() {
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatHasSizes, setNewCatHasSizes] = useState(true);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [transferCatId, setTransferCatId] = useState("");
  const [transferSize, setTransferSize] = useState("");
  const [transferQty, setTransferQty] = useState("1");
  const [transferFrom, setTransferFrom] = useState("");
  const [transferTo, setTransferTo] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "reports" | "history">("overview");
  const [showLossDialog, setShowLossDialog] = useState(false);
  const [lossCatId, setLossCatId] = useState("");
  const [lossStationId, setLossStationId] = useState("");
  const [lossSize, setLossSize] = useState("");
  const [lossQty, setLossQty] = useState("1");
  const [lossReason, setLossReason] = useState("");
  const [resolveId, setResolveId] = useState<number | null>(null);
  const [resolveNote, setResolveNote] = useState("");

  const { data: categories = [], isLoading: loadingCats } = useQuery<AccessoryCategory[]>({
    queryKey: ["/api/accessory-categories"],
  });

  const { data: inventory = [], isLoading: loadingInv } = useQuery<AccessoryInventory[]>({
    queryKey: ["/api/accessory-inventory"],
  });

  const { data: stationsList = [] } = useQuery<Station[]>({
    queryKey: ["/api/stations"],
  });

  const { data: transferHistory = [] } = useQuery<AccessoryTransfer[]>({
    queryKey: ["/api/accessory-transfers"],
    enabled: activeTab === "history",
  });

  const { data: lossReports = [] } = useQuery<LossReport[]>({
    queryKey: ["/api/accessory-loss-reports"],
    enabled: activeTab === "reports" || activeTab === "overview",
  });

  const pendingReports = lossReports.filter(r => r.status === "pending");

  const realStations = stationsList.filter(s => !s.isVirtual);

  const createCategoryMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/accessory-categories", { name: newCatName, hasSizes: newCatHasSizes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accessory-categories"] });
      setNewCatName("");
      setNewCatHasSizes(true);
      setShowNewCategory(false);
      toast({ title: "Category created" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/accessory-categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accessory-categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/accessory-inventory"] });
      toast({ title: "Category deleted" });
    },
  });

  const updateQtyMutation = useMutation({
    mutationFn: (data: { categoryId: number; stationId: number; size: string; quantity: number }) =>
      apiRequest("PATCH", "/api/accessory-inventory", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accessory-inventory"] });
    },
  });

  const transferMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/accessory-transfers", {
        categoryId: parseInt(transferCatId),
        size: transferSize || "Einheitsgröße",
        quantity: parseInt(transferQty),
        fromStationId: parseInt(transferFrom),
        toStationId: parseInt(transferTo),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accessory-inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/accessory-transfers"] });
      setShowTransferDialog(false);
      resetTransferForm();
      toast({ title: "Transfer completed" });
    },
    onError: (e: any) => toast({ title: "Transfer failed", description: e.message, variant: "destructive" }),
  });

  const reportLossMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/accessory-loss-reports", {
        categoryId: parseInt(lossCatId),
        stationId: parseInt(lossStationId),
        size: lossSize || "Einheitsgröße",
        quantity: parseInt(lossQty),
        reason: lossReason,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accessory-loss-reports"] });
      setShowLossDialog(false);
      resetLossForm();
      toast({ title: "Loss/damage reported" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id, approved }: { id: number; approved: boolean }) =>
      apiRequest("PATCH", `/api/accessory-loss-reports/${id}`, { approved, adminNote: resolveNote || null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accessory-loss-reports"] });
      queryClient.invalidateQueries({ queryKey: ["/api/accessory-inventory"] });
      setResolveId(null);
      setResolveNote("");
      toast({ title: "Report resolved" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const resetTransferForm = () => {
    setTransferCatId("");
    setTransferSize("");
    setTransferQty("1");
    setTransferFrom("");
    setTransferTo("");
  };

  const resetLossForm = () => {
    setLossCatId("");
    setLossStationId("");
    setLossSize("");
    setLossQty("1");
    setLossReason("");
  };

  const getQty = (categoryId: number, stationId: number, size: string) => {
    return inventory.find(i => i.categoryId === categoryId && i.stationId === stationId && i.size === size)?.quantity ?? 0;
  };

  const adjustQty = (categoryId: number, stationId: number, size: string, delta: number) => {
    const current = getQty(categoryId, stationId, size);
    const newQty = Math.max(0, current + delta);
    updateQtyMutation.mutate({ categoryId, stationId, size, quantity: newQty });
  };

  const selectedTransferCat = categories.find(c => c.id === parseInt(transferCatId));
  const selectedLossCat = categories.find(c => c.id === parseInt(lossCatId));

  const isLoading = loadingCats || loadingInv;

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40" />)}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-5">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-accessories-title">Accessories</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowLossDialog(true)}
            data-testid="button-report-loss"
          >
            <AlertTriangle className="h-4 w-4 mr-1.5" />
            Report Damage
          </Button>
          {isAdmin && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTransferDialog(true)}
                data-testid="button-open-transfer"
              >
                <ArrowRightLeft className="h-4 w-4 mr-1.5" />
                Transfer
              </Button>
              <Button
                size="sm"
                onClick={() => setShowNewCategory(true)}
                data-testid="button-add-category"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Category
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex gap-1 border-b">
        {[
          { key: "overview" as const, label: "Overview" },
          { key: "reports" as const, label: `Reports${pendingReports.length > 0 ? ` (${pendingReports.length})` : ""}` },
          { key: "history" as const, label: "Transfer History" },
        ].map(tab => (
          <button
            key={tab.key}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            onClick={() => setActiveTab(tab.key)}
            data-testid={`tab-${tab.key}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "history" && (
        <Card>
          <CardHeader className="pb-2">
            <h2 className="font-semibold">Transfer History</h2>
          </CardHeader>
          <CardContent>
            {transferHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No transfers yet</p>
            ) : (
              <div className="space-y-2">
                {transferHistory.map(t => (
                  <div key={t.id} className="flex items-center gap-2 text-sm border-b pb-2 last:border-0" data-testid={`row-transfer-${t.id}`}>
                    <Badge variant="outline" className="shrink-0">{t.categoryName}</Badge>
                    {t.size !== "Einheitsgröße" && <span className="text-xs text-muted-foreground">{t.size}</span>}
                    <span className="font-medium">×{t.quantity}</span>
                    <span className="text-muted-foreground">{t.fromStationName}</span>
                    <ArrowRightLeft className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">{t.toStationName}</span>
                    <span className="text-xs text-muted-foreground ml-auto shrink-0">
                      {new Date(t.transferredAt).toLocaleDateString("de-DE")}
                      {t.transferredByName && ` · ${t.transferredByName}`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "reports" && (
        <Card>
          <CardHeader className="pb-2">
            <h2 className="font-semibold">Loss & Damage Reports</h2>
          </CardHeader>
          <CardContent>
            {lossReports.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No reports</p>
            ) : (
              <div className="space-y-3">
                {lossReports.map(r => (
                  <div key={r.id} className={`border rounded-lg p-3 text-sm ${r.status === "pending" ? "border-orange-300 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/30" : ""}`} data-testid={`row-report-${r.id}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={r.status === "pending" ? "default" : r.status === "approved" ? "destructive" : "secondary"} className="text-[10px]">
                            {r.status === "pending" ? "Pending" : r.status === "approved" ? "Confirmed" : "Rejected"}
                          </Badge>
                          <span className="font-medium">{r.categoryName}</span>
                          {r.size !== "Einheitsgröße" && <span className="text-muted-foreground">{r.size}</span>}
                          <span className="font-medium">×{r.quantity}</span>
                        </div>
                        <p className="text-muted-foreground">{r.stationName} · {r.reason}</p>
                        <p className="text-xs text-muted-foreground">
                          Reported by {r.reportedByName} on {new Date(r.reportedAt).toLocaleDateString("de-DE")}
                          {r.resolvedByName && ` · Resolved by ${r.resolvedByName}`}
                        </p>
                        {r.adminNote && <p className="text-xs italic">Admin: {r.adminNote}</p>}
                      </div>
                      {isAdmin && r.status === "pending" && (
                        <div className="flex gap-1 shrink-0">
                          {resolveId === r.id ? (
                            <div className="flex flex-col gap-2">
                              <Input
                                placeholder="Note (optional)"
                                value={resolveNote}
                                onChange={e => setResolveNote(e.target.value)}
                                className="h-7 text-xs w-40"
                                data-testid={`input-resolve-note-${r.id}`}
                              />
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="h-7 text-xs"
                                  onClick={() => resolveMutation.mutate({ id: r.id, approved: true })}
                                  disabled={resolveMutation.isPending}
                                  data-testid={`button-approve-${r.id}`}
                                >
                                  <Check className="h-3 w-3 mr-1" />
                                  Deduct
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs"
                                  onClick={() => resolveMutation.mutate({ id: r.id, approved: false })}
                                  disabled={resolveMutation.isPending}
                                  data-testid={`button-reject-${r.id}`}
                                >
                                  <X className="h-3 w-3 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() => { setResolveId(r.id); setResolveNote(""); }}
                              data-testid={`button-resolve-${r.id}`}
                            >
                              Resolve
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "overview" && (
        <>
          {pendingReports.length > 0 && isAdmin && (
            <Card className="border-orange-300 dark:border-orange-800">
              <CardContent className="py-3">
                <button
                  className="flex items-center gap-2 text-sm text-orange-700 dark:text-orange-400 font-medium w-full"
                  onClick={() => setActiveTab("reports")}
                  data-testid="button-pending-reports"
                >
                  <AlertTriangle className="h-4 w-4" />
                  {pendingReports.length} open loss/damage report{pendingReports.length > 1 ? "s" : ""}
                </button>
              </CardContent>
            </Card>
          )}

          {categories.length === 0 ? (
            <div className="text-center py-16">
              <HardHat className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="font-medium text-lg">No accessory categories</h3>
              <p className="text-muted-foreground text-sm mt-1">Create a category to get started</p>
            </div>
          ) : (
            realStations.map(station => {
              const stationTotal = categories.reduce((sum, cat) => {
                if (cat.hasSizes) {
                  return sum + ACCESSORY_SIZES.reduce((s, sz) => s + getQty(cat.id, station.id, sz), 0);
                }
                return sum + getQty(cat.id, station.id, "Einheitsgröße");
              }, 0);

              return (
                <Card key={station.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <h2 className="font-semibold" data-testid={`text-station-name-${station.id}`}>{station.name}</h2>
                      <Badge variant="secondary">{stationTotal} pcs.</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-xs text-muted-foreground">
                            <th className="text-left py-2 pr-2 font-medium">Category</th>
                            {ACCESSORY_SIZES.map(sz => (
                              <th key={sz} className="text-center py-2 px-1 font-medium w-20">{sz}</th>
                            ))}
                            <th className="text-center py-2 px-1 font-medium w-20">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {categories.map(cat => {
                            if (cat.hasSizes) {
                              const total = ACCESSORY_SIZES.reduce((s, sz) => s + getQty(cat.id, station.id, sz), 0);
                              return (
                                <tr key={cat.id} className="border-b last:border-0" data-testid={`row-category-${cat.id}-station-${station.id}`}>
                                  <td className="py-2 pr-2 font-medium">{cat.name}</td>
                                  {ACCESSORY_SIZES.map(sz => {
                                    const qty = getQty(cat.id, station.id, sz);
                                    return (
                                      <td key={sz} className="text-center py-1 px-1">
                                        {isAdmin ? (
                                          <div className="flex items-center justify-center gap-0.5">
                                            <button
                                              className="h-6 w-6 rounded hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                                              onClick={() => adjustQty(cat.id, station.id, sz, -1)}
                                              disabled={qty <= 0}
                                              data-testid={`button-minus-${cat.id}-${station.id}-${sz}`}
                                            >
                                              <Minus className="h-3 w-3" />
                                            </button>
                                            <span className="w-6 text-center font-medium" data-testid={`text-qty-${cat.id}-${station.id}-${sz}`}>{qty}</span>
                                            <button
                                              className="h-6 w-6 rounded hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                                              onClick={() => adjustQty(cat.id, station.id, sz, 1)}
                                              data-testid={`button-plus-${cat.id}-${station.id}-${sz}`}
                                            >
                                              <Plus className="h-3 w-3" />
                                            </button>
                                          </div>
                                        ) : (
                                          <span className="font-medium" data-testid={`text-qty-${cat.id}-${station.id}-${sz}`}>{qty}</span>
                                        )}
                                      </td>
                                    );
                                  })}
                                  <td className="text-center py-2 px-1 font-semibold">{total}</td>
                                </tr>
                              );
                            } else {
                              const qty = getQty(cat.id, station.id, "Einheitsgröße");
                              return (
                                <tr key={cat.id} className="border-b last:border-0" data-testid={`row-category-${cat.id}-station-${station.id}`}>
                                  <td className="py-2 pr-2 font-medium">{cat.name}</td>
                                  <td colSpan={ACCESSORY_SIZES.length} className="text-center py-1 px-1">
                                    {isAdmin ? (
                                      <div className="flex items-center justify-center gap-1">
                                        <button
                                          className="h-6 w-6 rounded hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                                          onClick={() => adjustQty(cat.id, station.id, "Einheitsgröße", -1)}
                                          disabled={qty <= 0}
                                          data-testid={`button-minus-${cat.id}-${station.id}-one`}
                                        >
                                          <Minus className="h-3 w-3" />
                                        </button>
                                        <span className="w-8 text-center font-medium" data-testid={`text-qty-${cat.id}-${station.id}-one`}>{qty}</span>
                                        <button
                                          className="h-6 w-6 rounded hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                                          onClick={() => adjustQty(cat.id, station.id, "Einheitsgröße", 1)}
                                          data-testid={`button-plus-${cat.id}-${station.id}-one`}
                                        >
                                          <Plus className="h-3 w-3" />
                                        </button>
                                      </div>
                                    ) : (
                                      <span className="font-medium" data-testid={`text-qty-${cat.id}-${station.id}-one`}>{qty}</span>
                                    )}
                                  </td>
                                  <td className="text-center py-2 px-1 font-semibold">{qty}</td>
                                </tr>
                              );
                            }
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}

          {isAdmin && categories.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <h2 className="font-semibold text-sm">Manage Categories</h2>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {categories.map(cat => (
                    <div key={cat.id} className="flex items-center gap-1 border rounded-md px-2 py-1">
                      <span className="text-sm">{cat.name}</span>
                      {cat.hasSizes && <Badge variant="outline" className="text-[10px] px-1 py-0">Sizes</Badge>}
                      {cat.isDefault && <Badge variant="secondary" className="text-[10px] px-1 py-0">Default</Badge>}
                      {!cat.isDefault && (
                        <button
                          className="text-muted-foreground hover:text-destructive ml-1"
                          onClick={() => deleteCategoryMutation.mutate(cat.id)}
                          data-testid={`button-delete-category-${cat.id}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <Dialog open={showNewCategory} onOpenChange={setShowNewCategory}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                placeholder="e.g. Lycra"
                data-testid="input-category-name"
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="has-sizes"
                checked={newCatHasSizes}
                onCheckedChange={v => setNewCatHasSizes(!!v)}
                data-testid="checkbox-has-sizes"
              />
              <label htmlFor="has-sizes" className="text-sm cursor-pointer">Size-specific (XS–XL)</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewCategory(false)}>Cancel</Button>
            <Button
              onClick={() => createCategoryMutation.mutate()}
              disabled={!newCatName || createCategoryMutation.isPending}
              data-testid="button-save-category"
            >
              {createCategoryMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showTransferDialog} onOpenChange={(open) => { setShowTransferDialog(open); if (!open) resetTransferForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accessory Transfer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={transferCatId} onValueChange={v => { setTransferCatId(v); setTransferSize(""); }}>
                <SelectTrigger data-testid="select-transfer-category"><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedTransferCat?.hasSizes && (
              <div className="space-y-2">
                <Label>Size</Label>
                <Select value={transferSize} onValueChange={setTransferSize}>
                  <SelectTrigger data-testid="select-transfer-size"><SelectValue placeholder="Select size" /></SelectTrigger>
                  <SelectContent>
                    {ACCESSORY_SIZES.map(sz => (
                      <SelectItem key={sz} value={sz}>{sz}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input
                type="number"
                min="1"
                value={transferQty}
                onChange={e => setTransferQty(e.target.value)}
                data-testid="input-transfer-quantity"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>From Station</Label>
                <Select value={transferFrom} onValueChange={setTransferFrom}>
                  <SelectTrigger data-testid="select-transfer-from"><SelectValue placeholder="Source" /></SelectTrigger>
                  <SelectContent>
                    {realStations.map(s => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>To Station</Label>
                <Select value={transferTo} onValueChange={setTransferTo}>
                  <SelectTrigger data-testid="select-transfer-to"><SelectValue placeholder="Destination" /></SelectTrigger>
                  <SelectContent>
                    {realStations.filter(s => String(s.id) !== transferFrom).map(s => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowTransferDialog(false); resetTransferForm(); }}>Cancel</Button>
            <Button
              onClick={() => transferMutation.mutate()}
              disabled={
                !transferCatId || !transferFrom || !transferTo ||
                parseInt(transferQty) < 1 ||
                (selectedTransferCat?.hasSizes && !transferSize) ||
                transferMutation.isPending
              }
              data-testid="button-execute-transfer"
            >
              {transferMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Transfer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showLossDialog} onOpenChange={(open) => { setShowLossDialog(open); if (!open) resetLossForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Loss / Damage</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={lossCatId} onValueChange={v => { setLossCatId(v); setLossSize(""); }}>
                <SelectTrigger data-testid="select-loss-category"><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Station</Label>
              <Select value={lossStationId} onValueChange={setLossStationId}>
                <SelectTrigger data-testid="select-loss-station"><SelectValue placeholder="Select station" /></SelectTrigger>
                <SelectContent>
                  {realStations.map(s => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedLossCat?.hasSizes && (
              <div className="space-y-2">
                <Label>Size</Label>
                <Select value={lossSize} onValueChange={setLossSize}>
                  <SelectTrigger data-testid="select-loss-size"><SelectValue placeholder="Select size" /></SelectTrigger>
                  <SelectContent>
                    {ACCESSORY_SIZES.map(sz => (
                      <SelectItem key={sz} value={sz}>{sz}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input
                type="number"
                min="1"
                value={lossQty}
                onChange={e => setLossQty(e.target.value)}
                data-testid="input-loss-quantity"
              />
            </div>
            <div className="space-y-2">
              <Label>Reason / Description</Label>
              <Textarea
                value={lossReason}
                onChange={e => setLossReason(e.target.value)}
                placeholder="e.g. Helmet broken, Neoprene torn..."
                rows={3}
                data-testid="input-loss-reason"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowLossDialog(false); resetLossForm(); }}>Cancel</Button>
            <Button
              onClick={() => reportLossMutation.mutate()}
              disabled={
                !lossCatId || !lossStationId || !lossReason ||
                parseInt(lossQty) < 1 ||
                (selectedLossCat?.hasSizes && !lossSize) ||
                reportLossMutation.isPending
              }
              data-testid="button-submit-loss"
            >
              {reportLossMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
