import { useEffect, useRef, useState } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { BarcodeScanner } from "@/components/barcode-scanner";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, ScanLine, CheckCircle2, Circle, Wrench,
  AlertTriangle, Star, ClipboardCheck, Package, Camera, X, Loader2,
} from "lucide-react";
import type { Equipment, InventoryCheck, InventoryCheckItem } from "@shared/schema";
import { EQUIPMENT_TYPE_LABELS } from "@shared/schema";
import { cn } from "@/lib/utils";

interface CheckDetail {
  check: InventoryCheck;
  items: InventoryCheckItem[];
  equipment: Equipment[];
}

export default function InventoryCheckPage() {
  const [, params] = useRoute("/inventory-check/:id");
  const [, navigate] = useLocation();
  const checkId = parseInt(params?.id || "0");
  const { user } = useAuth();
  const { toast } = useToast();
  const [scannerOpen, setScannerOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [uploadingPhotoFor, setUploadingPhotoFor] = useState<number | null>(null);
  const itemRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const photoTargetEquipId = useRef<number | null>(null);

  const { data, isLoading } = useQuery<CheckDetail>({
    queryKey: ["/api/inventory-checks", checkId.toString()],
    queryFn: async () => {
      const res = await fetch(`/api/inventory-checks/${checkId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load inventory check");
      return res.json();
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ equipmentId, patch }: { equipmentId: number; patch: Partial<InventoryCheckItem> }) =>
      apiRequest("PATCH", `/api/inventory-checks/${checkId}/items/${equipmentId}`, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory-checks", checkId.toString()] });
    },
    onError: () => {
      toast({ title: "Failed to save", variant: "destructive" });
    },
  });

  const completeMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", `/api/inventory-checks/${checkId}/complete`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory-checks", checkId.toString()] });
      toast({ title: "Inventory check completed!" });
    },
    onError: () => {
      toast({ title: "Failed to complete", variant: "destructive" });
    },
  });

  const handleScan = (code: string) => {
    const eq = data?.equipment.find(
      (e) => e.serialNumber.toLowerCase() === code.toLowerCase()
    );
    if (!eq) {
      toast({ title: `Serial "${code}" not in this check`, variant: "destructive" });
      return;
    }
    const el = itemRefs.current[eq.id];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-primary");
      setTimeout(() => el.classList.remove("ring-2", "ring-primary"), 2000);
    }
    setExpandedItems((prev) => new Set(prev).add(eq.id));
    const currentItem = data?.items.find((i) => i.equipmentId === eq.id);
    if (!currentItem?.checked) {
      updateItemMutation.mutate({ equipmentId: eq.id, patch: { checked: 1 } });
    }
  };

  const toggleExpand = (equipmentId: number) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      next.has(equipmentId) ? next.delete(equipmentId) : next.add(equipmentId);
      return next;
    });
  };

  const triggerPhotoUpload = (equipmentId: number) => {
    photoTargetEquipId.current = equipmentId;
    photoInputRef.current?.click();
  };

  const handlePhotoFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const equipmentId = photoTargetEquipId.current;
    if (!file || !equipmentId) return;
    e.target.value = "";

    setUploadingPhotoFor(equipmentId);
    try {
      const urlRes = await fetch(
        `/api/inventory-checks/${checkId}/items/${equipmentId}/photos/upload-url`,
        { credentials: "include" }
      );
      if (!urlRes.ok) throw new Error("Could not get upload URL");
      const { uploadURL, objectPath } = await urlRes.json();

      const putRes = await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      if (!putRes.ok) throw new Error("Upload failed");

      const currentItem = data?.items.find((i) => i.equipmentId === equipmentId);
      const existingPhotos: string[] = currentItem?.photos ?? [];
      await apiRequest("PATCH", `/api/inventory-checks/${checkId}/items/${equipmentId}`, {
        photos: [...existingPhotos, objectPath],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory-checks", checkId.toString()] });
      toast({ title: "Photo added" });
    } catch {
      toast({ title: "Failed to upload photo", variant: "destructive" });
    } finally {
      setUploadingPhotoFor(null);
    }
  };

  const removePhoto = (equipmentId: number, photoUrl: string) => {
    const currentItem = data?.items.find((i) => i.equipmentId === equipmentId);
    const updated = (currentItem?.photos ?? []).filter((p) => p !== photoUrl);
    updateItemMutation.mutate({ equipmentId, patch: { photos: updated } });
  };

  const getItem = (equipmentId: number): InventoryCheckItem | undefined =>
    data?.items.find((i) => i.equipmentId === equipmentId);

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-full" />
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16" />)}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-4 md:p-6 text-center py-16">
        <p className="text-muted-foreground">Inventory check not found</p>
      </div>
    );
  }

  const { check, equipment } = data;
  const items = data.items;
  const checkedCount = items.filter((i) => i.checked).length;
  const totalCount = equipment.length;
  const progress = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;
  const isCompleted = check.status === "completed";
  const readOnly = isCompleted;

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-5">
      <BarcodeScanner open={scannerOpen} onClose={() => setScannerOpen(false)} onScan={handleScan} />

      {/* Hidden file input for photo capture — mobile-first */}
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handlePhotoFileSelected}
        data-testid="input-photo-capture"
      />

      {/* Header */}
      <div className="flex items-start gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/stations/${check.stationId}`)}
          data-testid="button-back-check"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold">Inventory Check</h1>
            <Badge
              variant={isCompleted ? "default" : "secondary"}
              data-testid="badge-check-status"
            >
              {isCompleted ? "Completed" : "In Progress"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Started {new Date(check.startedAt!).toLocaleString()}
            {isCompleted && check.completedAt && (
              <> · Completed {new Date(check.completedAt).toLocaleString()}</>
            )}
          </p>
        </div>
      </div>

      {!readOnly && (
        <Button
          size="lg"
          className="w-full h-16 text-lg font-bold gap-3 shadow-md active:scale-95 transition-transform"
          onClick={() => setScannerOpen(true)}
          data-testid="button-scan-check"
        >
          <ScanLine className="h-7 w-7" />
          Scan Barcode / QR Code
        </Button>
      )}

      {/* Progress */}
      <Card>
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center justify-between text-sm font-medium">
            <span data-testid="text-progress-label">
              {checkedCount} / {totalCount} items checked
            </span>
            <span className="text-muted-foreground">{progress}%</span>
          </div>
          <Progress value={progress} className="h-3" data-testid="progress-bar" />
          <div className="flex gap-4 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <Wrench className="h-3 w-3 text-orange-500" />
              {items.filter((i) => i.needsRepair).length} needs repair
            </span>
            <span className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-red-500" />
              {items.filter((i) => i.missing).length} missing
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Equipment items */}
      <div className="space-y-2">
        {equipment.map((eq) => {
          const item = getItem(eq.id);
          const isChecked = !!(item?.checked);
          const isMissing = !!(item?.missing);
          const needsRepair = !!(item?.needsRepair);
          const expanded = expandedItems.has(eq.id);

          return (
            <Card
              key={eq.id}
              ref={(el) => { itemRefs.current[eq.id] = el; }}
              className={cn(
                "transition-all",
                isChecked && !isMissing && "border-green-500/40 bg-green-500/5",
                isMissing && "border-red-500/40 bg-red-500/5",
              )}
              data-testid={`card-check-item-${eq.id}`}
            >
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  {/* Check toggle */}
                  {!readOnly ? (
                    <button
                      className="shrink-0 touch-manipulation"
                      onClick={() => {
                        updateItemMutation.mutate({
                          equipmentId: eq.id,
                          patch: { checked: isChecked ? 0 : 1 },
                        });
                      }}
                      data-testid={`button-check-item-${eq.id}`}
                    >
                      {isChecked ? (
                        <CheckCircle2 className="h-6 w-6 text-green-500" />
                      ) : (
                        <Circle className="h-6 w-6 text-muted-foreground" />
                      )}
                    </button>
                  ) : (
                    <div className="shrink-0">
                      {isChecked ? (
                        <CheckCircle2 className="h-6 w-6 text-green-500" />
                      ) : (
                        <Circle className="h-6 w-6 text-muted-foreground/40" />
                      )}
                    </div>
                  )}

                  {/* Main info */}
                  <div className="flex-1 min-w-0" onClick={() => !readOnly && toggleExpand(eq.id)}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm">{eq.brand} {eq.model}</p>
                      {isMissing && <Badge variant="destructive" className="text-[10px]">Missing</Badge>}
                      {needsRepair && <Badge variant="outline" className="text-[10px] border-orange-500 text-orange-600">Repair</Badge>}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-mono">{eq.serialNumber}</span>
                      <span>·</span>
                      <span>{EQUIPMENT_TYPE_LABELS[eq.type] || eq.type}</span>
                      {item?.conditionRating && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-0.5">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            {item.conditionRating}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Expand toggle (edit mode only) */}
                  {!readOnly && (
                    <button
                      className="shrink-0 text-muted-foreground text-xs px-2 py-1 rounded-md hover:bg-muted transition-colors"
                      onClick={() => toggleExpand(eq.id)}
                      data-testid={`button-expand-item-${eq.id}`}
                    >
                      {expanded ? "▲" : "▼"}
                    </button>
                  )}
                </div>

                {/* Expanded detail editor */}
                {(expanded || (readOnly && (item?.notes || item?.conditionRating || isMissing || needsRepair))) && (
                  <div className="mt-3 pt-3 border-t space-y-3">
                    {/* Condition stars */}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1.5">Condition</p>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            disabled={readOnly}
                            onClick={() => updateItemMutation.mutate({
                              equipmentId: eq.id,
                              patch: { conditionRating: item?.conditionRating === star ? null : star },
                            })}
                            className={cn("p-1 rounded transition-colors", readOnly ? "cursor-default" : "hover:bg-muted")}
                            data-testid={`button-star-${eq.id}-${star}`}
                          >
                            <Star
                              className={cn(
                                "h-5 w-5",
                                (item?.conditionRating ?? 0) >= star
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-muted-foreground/30"
                              )}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Flags */}
                    {!readOnly && (
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => updateItemMutation.mutate({
                            equipmentId: eq.id,
                            patch: { needsRepair: needsRepair ? 0 : 1 },
                          })}
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm border transition-colors",
                            needsRepair
                              ? "bg-orange-500/10 border-orange-500/40 text-orange-600"
                              : "border-border text-muted-foreground"
                          )}
                          data-testid={`button-needs-repair-${eq.id}`}
                        >
                          <Wrench className="h-3.5 w-3.5" />
                          Needs Repair
                        </button>
                        <button
                          onClick={() => updateItemMutation.mutate({
                            equipmentId: eq.id,
                            patch: { missing: isMissing ? 0 : 1 },
                          })}
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm border transition-colors",
                            isMissing
                              ? "bg-red-500/10 border-red-500/40 text-red-600"
                              : "border-border text-muted-foreground"
                          )}
                          data-testid={`button-missing-${eq.id}`}
                        >
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Missing
                        </button>
                      </div>
                    )}

                    {/* Notes */}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1.5">Notes <span className="font-normal text-muted-foreground/60">(optional)</span></p>
                      {readOnly ? (
                        <p className="text-sm text-muted-foreground">{item?.notes || "—"}</p>
                      ) : (
                        <NotesField
                          initialValue={item?.notes || ""}
                          onSave={(notes) => updateItemMutation.mutate({ equipmentId: eq.id, patch: { notes } })}
                        />
                      )}
                    </div>

                    {/* Photos — optional */}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1.5">Photos <span className="font-normal text-muted-foreground/60">(optional)</span></p>
                      {/* Thumbnail grid */}
                      {(item?.photos ?? []).length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {(item?.photos ?? []).map((photoUrl) => (
                            <div key={photoUrl} className="relative group w-20 h-20 rounded-md overflow-hidden border border-border">
                              <img
                                src={photoUrl}
                                alt="Check photo"
                                className="w-full h-full object-cover"
                              />
                              {!readOnly && (
                                <button
                                  onClick={() => removePhoto(eq.id, photoUrl)}
                                  className="absolute top-0.5 right-0.5 bg-black/60 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                  data-testid={`button-remove-photo-${eq.id}`}
                                >
                                  <X className="h-3 w-3 text-white" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      {!readOnly && (
                        <button
                          onClick={() => triggerPhotoUpload(eq.id)}
                          disabled={uploadingPhotoFor === eq.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm border border-border text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
                          data-testid={`button-add-photo-${eq.id}`}
                        >
                          {uploadingPhotoFor === eq.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Camera className="h-3.5 w-3.5" />
                          )}
                          {uploadingPhotoFor === eq.id ? "Uploading…" : "Add Photo"}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Complete / Summary footer */}
      {isCompleted ? (
        <Card className="border-green-500/40 bg-green-500/5">
          <CardContent className="p-4 flex items-center gap-3">
            <ClipboardCheck className="h-8 w-8 text-green-500 shrink-0" />
            <div>
              <p className="font-semibold text-green-700 dark:text-green-400">Check Completed</p>
              <p className="text-sm text-muted-foreground">
                {checkedCount}/{totalCount} items checked ·{" "}
                {items.filter((i) => i.needsRepair).length} for repair ·{" "}
                {items.filter((i) => i.missing).length} missing
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="pb-6">
          <Button
            className="w-full"
            size="lg"
            onClick={() => completeMutation.mutate()}
            disabled={completeMutation.isPending}
            data-testid="button-complete-check"
          >
            <ClipboardCheck className="h-5 w-5 mr-2" />
            {completeMutation.isPending ? "Completing..." : `Complete Check (${checkedCount}/${totalCount})`}
          </Button>
        </div>
      )}
    </div>
  );
}

function NotesField({ initialValue, onSave }: { initialValue: string; onSave: (v: string) => void }) {
  const [value, setValue] = useState(initialValue);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const handleChange = (v: string) => {
    setValue(v);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => onSave(v), 800);
  };

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <Textarea
      value={value}
      onChange={(e) => handleChange(e.target.value)}
      placeholder="Add notes..."
      className="text-sm h-16 resize-none"
    />
  );
}
