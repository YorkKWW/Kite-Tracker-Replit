import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ConditionBadge, StatusBadge } from "@/components/condition-badge";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Star, Wrench, ArrowLeftRight, Camera,
  Upload, Trash2, MapPin, Calendar, Hash, X, ChevronLeft, ChevronRight,
  FileText, Package, AlertTriangle,
} from "lucide-react";
import type { Equipment, Station, ConditionRating, Repair, Transfer, Photo } from "@shared/schema";
import { EQUIPMENT_TYPE_LABELS, TYPE_SPECIFIC_FIELDS } from "@shared/schema";

export default function EquipmentDetailPage() {
  const [, params] = useRoute("/equipment/:id");
  const id = params?.id;
  const { isHamburg, user } = useAuth();
  const { toast } = useToast();

  const { data: item, isLoading } = useQuery<Equipment>({
    queryKey: ["/api/equipment", id],
  });

  const { data: stationsList } = useQuery<Station[]>({ queryKey: ["/api/stations"] });
  const { data: ratingsData } = useQuery<ConditionRating[]>({ queryKey: ["/api/equipment", id, "ratings"] });
  const { data: repairsData } = useQuery<Repair[]>({ queryKey: ["/api/equipment", id, "repairs"] });
  const { data: transfersData } = useQuery<Transfer[]>({ queryKey: ["/api/equipment", id, "transfers"] });
  const { data: photosData } = useQuery<Photo[]>({ queryKey: ["/api/equipment", id, "photos"] });
  type ActivityEntry = { id: number; userId: number; action: string; equipmentId: number | null; details: string | null; timestamp: string | null; userName: string };
  const { data: activityData } = useQuery<ActivityEntry[]>({
    queryKey: ["/api/equipment", id, "activity"],
    queryFn: async () => {
      const res = await fetch(`/api/equipment/${id}/activity`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    staleTime: 0,
    enabled: !!id,
  });
  const { data: retailPrice } = useQuery<{ retailPrice: string; dealerPrice: string | null; supplier: string; productName: string } | null>({
    queryKey: ["/api/price-lists/lookup", item?.sku, item?.model, (item?.typeSpecificFields as any)?.size],
    queryFn: () => {
      if (!item) return Promise.resolve(null);
      const params = new URLSearchParams();
      if (item.sku) params.set("sku", item.sku);
      const size = (item.typeSpecificFields as any)?.size;
      const searchName = [item.model, size != null ? String(size) : ""].filter(Boolean).join(" ");
      if (searchName.length >= 3) params.set("name", searchName);
      if (!params.toString()) return Promise.resolve(null);
      return fetch(`/api/price-lists/lookup?${params}`, { credentials: "include" }).then((r) => r.json());
    },
    enabled: !!item,
  });

  const getStationName = (sid: number | null) => stationsList?.find((s) => s.id === sid)?.name || "Unknown";

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="p-4 md:p-6 text-center py-16">
        <p className="text-muted-foreground">Equipment not found</p>
        <Link href="/equipment">
          <Button variant="secondary" className="mt-4">Back to list</Button>
        </Link>
      </div>
    );
  }

  const typeFields = TYPE_SPECIFIC_FIELDS[item.type] || [];
  const specificFields = (item.typeSpecificFields || {}) as Record<string, any>;

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/equipment">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl md:text-2xl font-bold truncate" data-testid="text-equipment-name">
            {item.brand} {item.model}
          </h1>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
            {item.serialNumber && !item.serialNumber.startsWith("AUTO-") && !item.serialNumber.startsWith("IMPORT-") && (
              <span className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">S/N</span>
                <span className="font-mono text-base font-bold text-foreground" data-testid="text-serial-detail">{item.serialNumber}</span>
              </span>
            )}
            {(item as any).sku && (
              <span className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">SKU</span>
                <span className="font-mono text-sm text-muted-foreground" data-testid="text-sku-detail">{(item as any).sku}</span>
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <ConditionBadge rating={item.conditionRating} />
          <StatusBadge status={item.status} />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <InfoCard icon={<Hash className="h-4 w-4" />} label="Type" value={EQUIPMENT_TYPE_LABELS[item.type] || item.type} />
        <InfoCard icon={<MapPin className="h-4 w-4" />} label="Location" value={getStationName(item.currentStationId)} />
        <InfoCard
          icon={<Calendar className="h-4 w-4" />}
          label="Purchased"
          value={
            (item as any).purchaseDate
              ? new Date((item as any).purchaseDate).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
              : item.yearOfPurchase?.toString() || "N/A"
          }
        />
        <InfoCard icon={<Star className="h-4 w-4" />} label="Condition" value={`${item.conditionRating}/5`} />
      </div>

      <Card>
          <CardHeader className="pb-2">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Financial Data</h3>
          </CardHeader>
          <CardContent>
            <div className={`grid gap-4 ${isHamburg ? "grid-cols-3" : "grid-cols-2"}`}>
              {isHamburg && (
                <div>
                  <p className="text-xs text-muted-foreground">Purchase Price</p>
                  <p className="font-semibold" data-testid="text-purchase-price">
                    {item.purchasePrice ? `€${item.purchasePrice}` : "N/A"}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground">Current Value</p>
                <p className="font-semibold" data-testid="text-current-value">
                  {item.currentValue ? `€${item.currentValue}` : item.purchasePrice ? `€${item.purchasePrice}` : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Retail Price (UVP)</p>
                <p className="font-semibold" data-testid="text-retail-price">
                  {retailPrice?.retailPrice
                    ? `€${parseFloat(retailPrice.retailPrice).toLocaleString("de-DE", { minimumFractionDigits: 2 })}`
                    : "N/A"}
                </p>
              </div>
            </div>
            {retailPrice && (
              <div className="mt-3 pt-3 border-t">
                <p className="text-xs text-muted-foreground">Price source: {retailPrice.supplier} · {retailPrice.productName}</p>
              </div>
            )}
            {(item as any).invoiceReference && (
              <div className="mt-3 pt-3 border-t">
                <p className="text-xs text-muted-foreground">Imported from Invoice</p>
                <p className="font-mono text-sm font-semibold" data-testid="text-invoice-ref">
                  {(item as any).invoiceReference}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

      {typeFields.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Specifications</h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {typeFields.map((field) => (
                <div key={field.key}>
                  <p className="text-xs text-muted-foreground">{field.label}</p>
                  <p className="font-medium">{specificFields[field.key] ?? "N/A"}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {item.notes && (
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Notes</p>
            <p className="text-sm">{item.notes}</p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="photos" className="w-full">
        <TabsList className="w-full grid grid-cols-5">
          <TabsTrigger value="photos" data-testid="tab-photos">
            <Camera className="h-4 w-4 mr-1 hidden sm:inline" />
            Photos {photosData?.length ? `(${photosData.length})` : ""}
          </TabsTrigger>
          <TabsTrigger value="condition" data-testid="tab-condition">
            <Star className="h-4 w-4 mr-1 hidden sm:inline" />
            <span className="hidden sm:inline">Condition</span>
            <span className="sm:hidden">Cond.</span>
          </TabsTrigger>
          <TabsTrigger value="repairs" data-testid="tab-repairs">
            <Wrench className="h-4 w-4 mr-1 hidden sm:inline" />
            Repairs
          </TabsTrigger>
          <TabsTrigger value="transfers" data-testid="tab-transfers">
            <ArrowLeftRight className="h-4 w-4 mr-1 hidden sm:inline" />
            <span className="hidden sm:inline">Transfers</span>
            <span className="sm:hidden">Trans.</span>
          </TabsTrigger>
          <TabsTrigger value="activity" data-testid="tab-activity">
            <FileText className="h-4 w-4 mr-1 hidden sm:inline" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="photos" className="mt-4 space-y-4">
          <PhotosSection equipmentId={item.id} photos={photosData || []} />
        </TabsContent>

        <TabsContent value="condition" className="mt-4 space-y-4">
          <ConditionSection equipmentId={item.id} ratings={ratingsData || []} />
        </TabsContent>

        <TabsContent value="repairs" className="mt-4 space-y-4">
          <RepairsSection equipmentId={item.id} repairs={repairsData || []} isHamburg={isHamburg} />
        </TabsContent>

        <TabsContent value="transfers" className="mt-4 space-y-4">
          <TransfersSection
            equipmentId={item.id}
            currentStationId={item.currentStationId}
            transfers={transfersData || []}
            stations={stationsList || []}
            getStationName={getStationName}
            isHamburg={isHamburg}
          />
        </TabsContent>

        <TabsContent value="activity" className="mt-4 space-y-4">
          <EquipmentActivitySection logs={activityData || []} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-3 flex items-center gap-3">
        <div className="text-muted-foreground">{icon}</div>
        <div className="min-w-0">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className="font-medium text-sm truncate">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function PhotosSection({ equipmentId, photos }: { equipmentId: number; photos: Photo[] }) {
  const { toast } = useToast();
  const { data: uploaderInfo } = useQuery<{ id: number; name: string }[]>({
    queryKey: ["/api/users"],
  });
  const [uploading, setUploading] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const getUserName = (userId: number) =>
    uploaderInfo?.find((u) => u.id === userId)?.name || `User #${userId}`;

  const handleUpload = async (file: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const urlRes = await fetch(`/api/equipment/${equipmentId}/photos/upload-url`, {
        credentials: "include",
      });
      if (!urlRes.ok) throw new Error("Could not get upload URL");
      const { uploadURL, objectPath } = await urlRes.json();

      const putRes = await fetch(uploadURL, {
        method: "PUT",
        headers: { "Content-Type": file.type || "image/jpeg" },
        body: file,
      });
      if (!putRes.ok) throw new Error("Upload to storage failed");

      await fetch(`/api/equipment/${equipmentId}/photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ url: objectPath }),
      });

      toast({ title: "Photo uploaded" });
      queryClient.invalidateQueries({ queryKey: ["/api/equipment", equipmentId.toString(), "photos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/equipment/first-photos"] });
    } catch (err: any) {
      toast({ title: "Upload failed: " + err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const deleteMutation = useMutation({
    mutationFn: (photoId: number) => apiRequest("DELETE", `/api/photos/${photoId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment", equipmentId.toString(), "photos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/equipment/first-photos"] });
      toast({ title: "Photo deleted" });
    },
  });

  const lightboxPhoto = lightboxIndex !== null ? photos[lightboxIndex] : null;

  return (
    <>
      <div className="flex gap-2">
        <label className="flex-1 flex items-center justify-center gap-2 p-3 border-2 border-dashed rounded-md cursor-pointer text-muted-foreground transition-colors" data-testid="button-upload-photo">
          <Camera className="h-4 w-4" />
          <span className="text-sm">{uploading ? "Uploading..." : "Take Photo"}</span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ""; }}
            disabled={uploading}
          />
        </label>
        <label className="flex-1 flex items-center justify-center gap-2 p-3 border-2 border-dashed rounded-md cursor-pointer text-muted-foreground transition-colors" data-testid="button-choose-photo">
          <Upload className="h-4 w-4" />
          <span className="text-sm">Library</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ""; }}
            disabled={uploading}
          />
        </label>
      </div>

      {photos.length === 0 ? (
        <p className="text-center text-muted-foreground text-sm py-8">No photos yet</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {photos.map((p, idx) => (
            <div key={p.id} className="relative group rounded-md overflow-hidden">
              <img
                src={p.url}
                alt={p.caption || "Equipment photo"}
                className="w-full h-36 object-cover cursor-pointer"
                onClick={() => setLightboxIndex(idx)}
                data-testid={`img-photo-${p.id}`}
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                <p className="text-[10px] text-white leading-tight">{getUserName(p.uploadedBy)}</p>
                <p className="text-[10px] text-white/70">
                  {p.uploadedAt ? new Date(p.uploadedAt).toLocaleDateString() : ""}
                </p>
              </div>
              <button
                onClick={() => deleteMutation.mutate(p.id)}
                className="absolute top-2 right-2 p-1.5 rounded-md bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity"
                data-testid={`button-delete-photo-${p.id}`}
              >
                <Trash2 className="h-3 w-3 text-destructive" />
              </button>
            </div>
          ))}
        </div>
      )}

      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white"
            onClick={() => setLightboxIndex(null)}
            data-testid="button-close-lightbox"
          >
            <X className="h-5 w-5" />
          </button>
          {lightboxIndex !== null && lightboxIndex > 0 && (
            <button
              className="absolute left-4 p-2 rounded-full bg-white/10 text-white"
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex - 1); }}
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}
          {lightboxIndex !== null && lightboxIndex < photos.length - 1 && (
            <button
              className="absolute right-4 p-2 rounded-full bg-white/10 text-white"
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex + 1); }}
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}
          <img
            src={lightboxPhoto.url}
            alt={lightboxPhoto.caption || "Photo"}
            className="max-w-full max-h-full object-contain rounded-md"
            onClick={(e) => e.stopPropagation()}
            data-testid="img-lightbox"
          />
          <div className="absolute bottom-4 left-0 right-0 text-center">
            <p className="text-white text-sm">{getUserName(lightboxPhoto.uploadedBy)}</p>
            <p className="text-white/60 text-xs">
              {lightboxPhoto.uploadedAt ? new Date(lightboxPhoto.uploadedAt).toLocaleString() : ""}
            </p>
            {lightboxIndex !== null && (
              <p className="text-white/40 text-xs mt-1">{lightboxIndex + 1} / {photos.length}</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function ConditionSection({ equipmentId, ratings }: { equipmentId: number; ratings: ConditionRating[] }) {
  const { toast } = useToast();
  const [rating, setRating] = useState("5");
  const [notes, setNotes] = useState("");
  const [open, setOpen] = useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", `/api/equipment/${equipmentId}/ratings`, {
        rating: parseInt(rating),
        notes: notes || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment", equipmentId.toString(), "ratings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/equipment", equipmentId.toString()] });
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      toast({ title: "Condition updated" });
      setNotes("");
      setOpen(false);
    },
  });

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button data-testid="button-rate-condition">
            <Star className="h-4 w-4 mr-2" />
            Rate Condition
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Condition Rating</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Rating</Label>
              <Select value={rating} onValueChange={setRating}>
                <SelectTrigger data-testid="select-rating">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 - Like New</SelectItem>
                  <SelectItem value="4">4 - Good</SelectItem>
                  <SelectItem value="3">3 - Fair</SelectItem>
                  <SelectItem value="2">2 - Poor</SelectItem>
                  <SelectItem value="1">1 - Trash</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Describe the condition..." data-testid="input-rating-notes" />
            </div>
            <Button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="w-full" data-testid="button-submit-rating">
              {mutation.isPending ? "Saving..." : "Save Rating"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {ratings.length === 0 ? (
        <p className="text-center text-muted-foreground text-sm py-8">No condition ratings recorded</p>
      ) : (
        <div className="space-y-2">
          {ratings.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-3 flex items-center justify-between gap-1">
                <div className="flex items-center gap-3">
                  <ConditionBadge rating={r.rating} />
                  <span className="text-sm">{r.notes || "No notes"}</span>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {r.ratedAt ? new Date(r.ratedAt).toLocaleDateString() : ""}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

function RepairsSection({
  equipmentId,
  repairs,
  isHamburg,
}: {
  equipmentId: number;
  repairs: Repair[];
  isHamburg: boolean;
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [desc, setDesc] = useState("");
  const [cost, setCost] = useState("");
  const [status, setStatus] = useState("pending");

  const mutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", `/api/equipment/${equipmentId}/repairs`, {
        description: desc,
        cost: isHamburg && cost ? cost : null,
        status,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment", equipmentId.toString(), "repairs"] });
      toast({ title: "Repair logged" });
      setDesc("");
      setCost("");
      setOpen(false);
    },
  });

  const completeMutation = useMutation({
    mutationFn: (repairId: number) =>
      apiRequest("PATCH", `/api/repairs/${repairId}`, { status: "completed" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment", equipmentId.toString(), "repairs"] });
      toast({ title: "Repair marked complete" });
    },
  });

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button data-testid="button-log-repair">
            <Wrench className="h-4 w-4 mr-2" />
            Log Repair
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Repair</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Describe the repair..." data-testid="input-repair-description" />
            </div>
            {isHamburg && (
              <div className="space-y-2">
                <Label>Cost (€)</Label>
                <Input type="number" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="0.00" data-testid="input-repair-cost" />
              </div>
            )}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger data-testid="select-repair-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !desc} className="w-full" data-testid="button-submit-repair">
              {mutation.isPending ? "Saving..." : "Save Repair"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {repairs.length === 0 ? (
        <p className="text-center text-muted-foreground text-sm py-8">No repairs recorded</p>
      ) : (
        <div className="space-y-2">
          {repairs.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-1">
                  <div>
                    <p className="text-sm font-medium">{r.description}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <StatusBadge status={r.status === "completed" ? "active" : "in_repair"} />
                      {isHamburg && r.cost && <span className="text-xs text-muted-foreground">€{r.cost}</span>}
                      <span className="text-xs text-muted-foreground">
                        {r.date ? new Date(r.date).toLocaleDateString() : ""}
                      </span>
                    </div>
                  </div>
                  {r.status === "pending" && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => completeMutation.mutate(r.id)}
                      data-testid={`button-complete-repair-${r.id}`}
                    >
                      Complete
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

function TransfersSection({
  equipmentId,
  currentStationId,
  transfers,
  stations,
  getStationName,
  isHamburg,
}: {
  equipmentId: number;
  currentStationId: number | null;
  transfers: Transfer[];
  stations: Station[];
  getStationName: (id: number | null) => string;
  isHamburg: boolean;
}) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [toStationId, setToStationId] = useState("");

  const createMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/transfers", {
        equipmentId,
        fromStationId: currentStationId,
        toStationId: parseInt(toStationId),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment", equipmentId.toString(), "transfers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/equipment", equipmentId.toString()] });
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transfers"] });
      toast({ title: "Transfer initiated" });
      setOpen(false);
    },
  });

  const confirmMutation = useMutation({
    mutationFn: (transferId: number) =>
      apiRequest("POST", `/api/transfers/${transferId}/confirm`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment", equipmentId.toString(), "transfers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/equipment", equipmentId.toString()] });
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transfers"] });
      toast({ title: "Transfer confirmed" });
    },
  });

  return (
    <>
      {isHamburg && (
      <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-initiate-transfer">
              <ArrowLeftRight className="h-4 w-4 mr-2" />
              Initiate Transfer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Transfer Equipment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <p className="text-sm text-muted-foreground">
                From: <span className="font-medium text-foreground">{currentStationId ? getStationName(currentStationId) : "Unassigned"}</span>
              </p>
              <div className="space-y-2">
                <Label>Transfer to</Label>
                <Select value={toStationId} onValueChange={setToStationId}>
                  <SelectTrigger data-testid="select-transfer-destination">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {stations
                      .filter((s) => s.id !== currentStationId)
                      .map((s) => (
                        <SelectItem key={s.id} value={s.id.toString()}>
                          {s.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => createMutation.mutate()} disabled={!toStationId || createMutation.isPending} className="w-full" data-testid="button-submit-transfer">
                {createMutation.isPending ? "Sending..." : "Initiate Transfer"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {transfers.length === 0 ? (
        <p className="text-center text-muted-foreground text-sm py-8">No transfers recorded</p>
      ) : (
        <div className="space-y-2">
          {transfers.map((t) => (
            <Card key={t.id}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between gap-1 flex-wrap">
                  <div className="space-y-1">
                    <p className="text-sm">
                      {getStationName(t.fromStationId)} → {getStationName(t.toStationId)}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge
                        status={t.status === "confirmed" ? "active" : t.status === "pending" ? "in_transfer" : "retired"}
                      />
                      <span className="text-xs text-muted-foreground">
                        {t.initiatedAt ? new Date(t.initiatedAt).toLocaleDateString() : ""}
                      </span>
                    </div>
                  </div>
                  {t.status === "pending" && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => confirmMutation.mutate(t.id)}
                      data-testid={`button-confirm-transfer-${t.id}`}
                    >
                      Confirm
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

const EQUIPMENT_ACTION_ICONS: Record<string, React.ReactNode> = {
  equipment_created: <Package className="h-4 w-4 text-primary" />,
  equipment_updated: <Package className="h-4 w-4 text-blue-500" />,
  equipment_deleted: <Package className="h-4 w-4 text-destructive" />,
  condition_rated: <Star className="h-4 w-4 text-yellow-500" />,
  repair_logged: <Wrench className="h-4 w-4 text-orange-500" />,
  transfer_initiated: <ArrowLeftRight className="h-4 w-4 text-purple-500" />,
  transfer_confirmed: <ArrowLeftRight className="h-4 w-4 text-green-500" />,
  transfer_item_missing: <AlertTriangle className="h-4 w-4 text-red-500" />,
  photo_added: <Camera className="h-4 w-4 text-sky-500" />,
};

function formatRelativeTime(ts: string | null) {
  if (!ts) return "";
  const d = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

type ActivityEntry = { id: number; userId: number; action: string; equipmentId: number | null; details: string | null; timestamp: string | null; userName: string };

function EquipmentActivitySection({ logs }: { logs: ActivityEntry[] }) {
  if (logs.length === 0) {
    return (
      <p className="text-center text-muted-foreground text-sm py-8">No history recorded</p>
    );
  }

  return (
    <div className="relative pl-6 space-y-0">
      <div className="absolute left-3 top-2 bottom-2 w-px bg-border" />
      {logs.map((log) => (
        <div key={log.id} className="relative pb-5" data-testid={`activity-item-${log.id}`}>
          <div className="absolute -left-3.5 top-1 w-7 h-7 rounded-full bg-background border-2 border-border flex items-center justify-center">
            {EQUIPMENT_ACTION_ICONS[log.action] || <FileText className="h-3.5 w-3.5 text-muted-foreground" />}
          </div>
          <div className="ml-4 pt-0.5">
            <p className="text-sm leading-relaxed">{log.details || log.action}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-medium text-muted-foreground">{log.userName}</span>
              <span className="text-xs text-muted-foreground/60">·</span>
              <span className="text-xs text-muted-foreground/60">{formatRelativeTime(log.timestamp)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
