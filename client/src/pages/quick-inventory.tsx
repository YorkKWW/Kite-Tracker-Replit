import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Link, useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Loader2, ScanLine, ClipboardCheck, ChevronDown, ChevronUp,
  History, AlertTriangle, CheckCircle2, Minus, Plus, Circle, Package, ArrowLeft,
} from "lucide-react";
import { EQUIPMENT_TYPE_LABELS } from "@shared/schema";
import type { AccessoryCategory, AccessoryInventory, InventoryCheck, InventoryCheckItem, Equipment } from "@shared/schema";

interface QuickInventoryData {
  stationName: string;
  openEquipCheck: (InventoryCheck & { checkedCount: number }) | null;
  openCheckItems: InventoryCheckItem[];
  openCheckEquipment: Equipment[];
  recentEquipChecks: (InventoryCheck & { startedByName: string })[];
  recentAccChecks: { id: number; stationId: number; checkedBy: number; checkedAt: string; totalCategories: number; totalDifferences: number; checkedByName: string }[];
  accessoryInventory: AccessoryInventory[];
  accessoryCategories: AccessoryCategory[];
}

interface CountRow {
  categoryId: number;
  categoryName: string;
  size: string | null;
  hasSizes: boolean;
  targetQuantity: number;
  actualQuantity: number | null;
  notes: string;
}

export default function QuickInventoryPage() {
  const { user, isSimulating, simStationId } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [showHistory, setShowHistory] = useState(false);
  const [showEquipList, setShowEquipList] = useState(false);
  const [countRows, setCountRows] = useState<CountRow[] | null>(null);
  const [saving, setSaving] = useState(false);

  const stationId = isSimulating ? simStationId : user?.assignedStationId;

  const { data, isLoading } = useQuery<QuickInventoryData>({
    queryKey: ["/api/stations", stationId, "quick-inventory"],
    queryFn: async () => {
      const res = await fetch(`/api/stations/${stationId}/quick-inventory`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
    enabled: !!stationId,
    staleTime: 0,
  });

  const startEquipCheck = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/stations/${stationId}/inventory-checks`);
      return res.json();
    },
    onSuccess: (check: InventoryCheck) => {
      navigate(`/inventory-check/${check.id}`);
    },
    onError: () => {
      toast({ title: "Error", description: "Could not start equipment scan", variant: "destructive" });
    },
  });

  const initCountRows = () => {
    if (!data) return;
    const rows: CountRow[] = [];
    for (const cat of data.accessoryCategories.sort((a, b) => a.sortOrder - b.sortOrder)) {
      const catInventory = data.accessoryInventory.filter(i => i.categoryId === cat.id);
      if (catInventory.length === 0) continue;
      if (cat.hasSizes) {
        for (const inv of catInventory) {
          rows.push({
            categoryId: cat.id,
            categoryName: cat.name,
            size: inv.size,
            hasSizes: true,
            targetQuantity: inv.quantity,
            actualQuantity: null,
            notes: "",
          });
        }
      } else {
        const inv = catInventory[0];
        rows.push({
          categoryId: cat.id,
          categoryName: cat.name,
          size: null,
          hasSizes: false,
          targetQuantity: inv.quantity,
          actualQuantity: null,
          notes: "",
        });
      }
    }
    setCountRows(rows);
  };

  const updateCount = (index: number, value: number | null) => {
    if (!countRows) return;
    const updated = [...countRows];
    updated[index] = { ...updated[index], actualQuantity: value };
    setCountRows(updated);
  };

  const updateNotes = (index: number, value: string) => {
    if (!countRows) return;
    const updated = [...countRows];
    updated[index] = { ...updated[index], notes: value };
    setCountRows(updated);
  };

  const increment = (index: number) => {
    if (!countRows) return;
    const current = countRows[index].actualQuantity ?? 0;
    updateCount(index, current + 1);
  };

  const decrement = (index: number) => {
    if (!countRows) return;
    const current = countRows[index].actualQuantity ?? 0;
    if (current > 0) updateCount(index, current - 1);
  };

  const saveAccessoryCount = async () => {
    if (!countRows || !stationId) return;
    const filled = countRows.filter(r => r.actualQuantity !== null);
    if (filled.length === 0) {
      toast({ title: "No data", description: "Please count at least one category", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await apiRequest("POST", `/api/stations/${stationId}/accessory-checks`, {
        items: filled.map(r => ({
          categoryId: r.categoryId,
          size: r.size,
          targetQuantity: r.targetQuantity,
          actualQuantity: r.actualQuantity!,
          notes: r.notes || undefined,
        })),
      });
      toast({ title: "Saved", description: `Accessory count saved (${filled.length} items)` });
      setCountRows(null);
      queryClient.invalidateQueries({ queryKey: ["/api/stations", stationId, "quick-inventory"] });
    } catch {
      toast({ title: "Error", description: "Could not save accessory count", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const filledCount = countRows?.filter(r => r.actualQuantity !== null).length ?? 0;
  const totalCount = countRows?.length ?? 0;
  const diffCount = countRows?.filter(r => r.actualQuantity !== null && r.actualQuantity !== r.targetQuantity).length ?? 0;
  const accProgress = totalCount > 0 ? Math.round((filledCount / totalCount) * 100) : 0;

  if (!stationId) {
    return (
      <div className="p-6 text-center space-y-2" data-testid="text-no-station">
        <ClipboardCheck className="h-10 w-10 mx-auto text-muted-foreground/50" />
        <p className="text-muted-foreground text-sm">
          {isSimulating
            ? "No station selected. Use the simulation banner above to pick a station."
            : "No station assigned. Please contact an admin."}
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) return null;

  const equipCheckedCount = data.openEquipCheck?.checkedCount ?? 0;
  const equipTotalItems = data.openEquipCheck?.totalItems ?? 0;
  const equipProgress = equipTotalItems > 0 ? Math.round((equipCheckedCount / equipTotalItems) * 100) : 0;

  const totalAccItems = data.accessoryInventory.length;

  const openCheckItems = data.openCheckItems ?? [];
  const openCheckEquipment = data.openCheckEquipment ?? [];

  const getCheckItem = (equipmentId: number): InventoryCheckItem | undefined =>
    openCheckItems.find(i => i.equipmentId === equipmentId);

  const checkedEquipIds = new Set(openCheckItems.filter(i => i.checked).map(i => i.equipmentId));

  const sortedEquipment = [...openCheckEquipment].sort((a, b) => {
    const aChecked = checkedEquipIds.has(a.id) ? 1 : 0;
    const bChecked = checkedEquipIds.has(b.id) ? 1 : 0;
    if (aChecked !== bChecked) return aChecked - bChecked;
    return (a.brand + a.model).localeCompare(b.brand + b.model);
  });

  return (
    <div className="max-w-lg mx-auto p-4 space-y-6 pb-28">
      <div>
        <div className="flex items-center gap-2">
          <Link href="/">
            <Button variant="ghost" size="icon" className="h-8 w-8" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Quick Inventory</h1>
        </div>
        <p className="text-muted-foreground text-sm" data-testid="text-station-date">
          {data.stationName} — {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* SECTION 1 — Equipment Scan */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ScanLine className="h-5 w-5" />
            Equipment Scan
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.openEquipCheck ? (
            <div className="space-y-3">
              <button
                className="w-full text-left"
                onClick={() => setShowEquipList(!showEquipList)}
                data-testid="button-toggle-equip-list"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Check in progress</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" data-testid="badge-equip-progress">
                      {equipCheckedCount}/{equipTotalItems} scanned
                    </Badge>
                    {showEquipList ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </div>
                <div className="w-full bg-secondary rounded-full h-2 mt-2">
                  <div
                    className="bg-primary rounded-full h-2 transition-all"
                    style={{ width: `${equipProgress}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1 text-center">{equipProgress}%</p>
              </button>

              {showEquipList && (
                <div className="space-y-1.5 mt-2 max-h-[50vh] overflow-y-auto" data-testid="list-equip-scan">
                  {sortedEquipment.map(eq => {
                    const isChecked = checkedEquipIds.has(eq.id);
                    const item = getCheckItem(eq.id);
                    const isMissing = !!(item?.missing);
                    return (
                      <div
                        key={eq.id}
                        className={`flex items-center gap-2.5 rounded-lg border px-3 py-2.5 transition-colors ${
                          isMissing
                            ? "border-red-400 bg-red-50 dark:border-red-800 dark:bg-red-950"
                            : isChecked
                              ? "border-green-400 bg-green-50 dark:border-green-800 dark:bg-green-950"
                              : "border-border bg-muted/30"
                        }`}
                        data-testid={`row-equip-scan-${eq.id}`}
                      >
                        {isChecked ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground/40 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {eq.brand} {eq.model}
                          </p>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span>{EQUIPMENT_TYPE_LABELS[eq.type] || eq.type}</span>
                            <span>·</span>
                            <span className="font-mono truncate">{eq.serialNumber}</span>
                          </div>
                        </div>
                        {isMissing && (
                          <Badge variant="destructive" className="text-[10px] shrink-0">Missing</Badge>
                        )}
                        {!isChecked && !isMissing && (
                          <Badge variant="secondary" className="text-[10px] shrink-0 bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300">Open</Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <Button
                className="w-full"
                onClick={() => navigate(`/inventory-check/${data.openEquipCheck!.id}`)}
                data-testid="button-resume-equip-scan"
              >
                <ScanLine className="h-4 w-4 mr-2" />
                Resume Equipment Scan
              </Button>
            </div>
          ) : (
            <Button
              className="w-full"
              onClick={() => startEquipCheck.mutate()}
              disabled={startEquipCheck.isPending}
              data-testid="button-start-equip-scan"
            >
              {startEquipCheck.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ScanLine className="h-4 w-4 mr-2" />
              )}
              Start Equipment Scan
            </Button>
          )}
        </CardContent>
      </Card>

      {/* SECTION 2 — Accessory Count */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-lg">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" />
              Accessory Count
            </div>
            {countRows && (
              <button
                onClick={() => setCountRows(null)}
                className="text-muted-foreground hover:text-foreground transition-colors text-sm font-normal flex items-center gap-1"
                data-testid="button-close-acc-count"
              >
                <ChevronUp className="h-4 w-4" />
                Close
              </button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!countRows ? (
            <div className="space-y-3">
              <button
                className="w-full text-left"
                onClick={initCountRows}
                data-testid="button-toggle-acc-count"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {totalAccItems > 0 ? "Ready to count" : "No accessories configured"}
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" data-testid="badge-acc-progress">
                      0/{totalAccItems} counted
                    </Badge>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="w-full bg-secondary rounded-full h-2 mt-2">
                  <div className="bg-primary rounded-full h-2" style={{ width: "0%" }} />
                </div>
                <p className="text-xs text-muted-foreground mt-1 text-center">0%</p>
              </button>
              <Button
                className="w-full"
                variant="outline"
                onClick={initCountRows}
                disabled={totalAccItems === 0}
                data-testid="button-start-acc-count"
              >
                <ClipboardCheck className="h-4 w-4 mr-2" />
                Start Accessory Count
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {countRows.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4" data-testid="text-no-accessories">
                  No accessories configured for this station.
                </p>
              ) : (
                <>
                  <div className="rounded-lg bg-muted/50 border p-3 space-y-2" data-testid="acc-progress-section">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold">{filledCount}/{totalCount} counted</span>
                      <span className="text-muted-foreground font-medium">{accProgress}%</span>
                    </div>
                    <Progress value={accProgress} className="h-3" data-testid="progress-acc" />
                    {diffCount > 0 && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {diffCount} difference{diffCount !== 1 ? "s" : ""} found
                      </p>
                    )}
                  </div>

                  {data.accessoryCategories
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map(cat => {
                      const catRows = countRows
                        .map((r, idx) => ({ ...r, idx }))
                        .filter(r => r.categoryId === cat.id);
                      if (catRows.length === 0) return null;
                      const catFilled = catRows.filter(r => r.actualQuantity !== null).length;
                      return (
                        <div key={cat.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide" data-testid={`text-cat-header-${cat.id}`}>
                              {cat.name}
                            </h3>
                            <span className="text-xs text-muted-foreground" data-testid={`text-cat-progress-${cat.id}`}>
                              {catFilled}/{catRows.length}
                            </span>
                          </div>
                          {catRows.map(row => {
                            const filled = row.actualQuantity !== null;
                            const matches = filled && row.actualQuantity === row.targetQuantity;
                            const differs = filled && row.actualQuantity !== row.targetQuantity;
                            return (
                              <div
                                key={row.idx}
                                className={`rounded-lg border p-3 transition-colors ${
                                  matches ? "border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950" :
                                  differs ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950" :
                                  "border-border"
                                }`}
                                data-testid={`card-acc-row-${row.idx}`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <span className="text-sm font-medium">
                                      {row.hasSizes ? row.size : cat.name}
                                    </span>
                                    <span className="text-xs text-muted-foreground ml-2" data-testid={`text-target-${row.idx}`}>
                                      Target: {row.targetQuantity}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      size="icon"
                                      variant="outline"
                                      className="h-9 w-9"
                                      onClick={() => decrement(row.idx)}
                                      data-testid={`button-dec-${row.idx}`}
                                    >
                                      <Minus className="h-4 w-4" />
                                    </Button>
                                    <Input
                                      type="number"
                                      min={0}
                                      className="w-16 h-9 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                      value={row.actualQuantity === null ? "" : row.actualQuantity}
                                      onChange={(e) => updateCount(row.idx, e.target.value === "" ? null : parseInt(e.target.value) || 0)}
                                      placeholder="–"
                                      data-testid={`input-count-${row.idx}`}
                                    />
                                    <Button
                                      size="icon"
                                      variant="outline"
                                      className="h-9 w-9"
                                      onClick={() => increment(row.idx)}
                                      data-testid={`button-inc-${row.idx}`}
                                    >
                                      <Plus className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                                {differs && (
                                  <div className="mt-2">
                                    <Input
                                      placeholder="Note (optional)"
                                      className="h-8 text-xs"
                                      value={row.notes}
                                      onChange={(e) => updateNotes(row.idx, e.target.value)}
                                      data-testid={`input-note-${row.idx}`}
                                    />
                                  </div>
                                )}
                                {matches && (
                                  <div className="flex items-center gap-1 mt-1 text-green-600 dark:text-green-400">
                                    <CheckCircle2 className="h-3 w-3" />
                                    <span className="text-xs">Match</span>
                                  </div>
                                )}
                                {differs && (
                                  <div className="flex items-center gap-1 mt-1 text-red-600 dark:text-red-400">
                                    <AlertTriangle className="h-3 w-3" />
                                    <span className="text-xs">
                                      Difference: {(row.actualQuantity ?? 0) - row.targetQuantity > 0 ? "+" : ""}{(row.actualQuantity ?? 0) - row.targetQuantity}
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}

                  <div className="border-t pt-4 space-y-3">
                    <Button
                      className="w-full"
                      onClick={saveAccessoryCount}
                      disabled={saving || filledCount === 0}
                      data-testid="button-save-acc-count"
                    >
                      {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ClipboardCheck className="h-4 w-4 mr-2" />}
                      Save Accessory Count
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* HISTORY */}
      <Card>
        <CardHeader className="pb-3 cursor-pointer" onClick={() => setShowHistory(!showHistory)}>
          <CardTitle className="flex items-center justify-between text-lg">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5" />
              History
            </div>
            {showHistory ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </CardTitle>
        </CardHeader>
        {showHistory && (
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold mb-2">Equipment Checks</h4>
              {data.recentEquipChecks.length === 0 ? (
                <p className="text-xs text-muted-foreground">No completed checks yet</p>
              ) : (
                <div className="space-y-2">
                  {data.recentEquipChecks.map(check => (
                    <div key={check.id} className="flex items-center justify-between text-sm border rounded-lg px-3 py-2" data-testid={`row-equip-history-${check.id}`}>
                      <div>
                        <span className="font-medium">{check.completedAt ? new Date(check.completedAt).toLocaleDateString() : "–"}</span>
                        <span className="text-muted-foreground ml-2">{check.startedByName}</span>
                      </div>
                      <Badge variant="secondary">{check.totalItems} items</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-2">Accessory Counts</h4>
              {data.recentAccChecks.length === 0 ? (
                <p className="text-xs text-muted-foreground">No counts yet</p>
              ) : (
                <div className="space-y-2">
                  {data.recentAccChecks.map(check => (
                    <div key={check.id} className="flex items-center justify-between text-sm border rounded-lg px-3 py-2" data-testid={`row-acc-history-${check.id}`}>
                      <div>
                        <span className="font-medium">{new Date(check.checkedAt).toLocaleDateString()}</span>
                        <span className="text-muted-foreground ml-2">{check.checkedByName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{check.totalCategories} items</Badge>
                        {check.totalDifferences > 0 && (
                          <Badge variant="destructive">{check.totalDifferences} diff</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
