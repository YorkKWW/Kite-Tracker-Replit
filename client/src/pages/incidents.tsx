import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertTriangle, Plus, X, Upload, Camera, CheckCircle2, Clock,
  Search, Filter, ChevronDown, ChevronUp, Image as ImageIcon,
} from "lucide-react";
import type { Equipment, Station } from "@shared/schema";
import { Link } from "wouter";

type DamageReport = {
  id: number;
  equipmentId: number;
  reportedAt: string | null;
  howItHappened: string;
  customerName: string | null;
  bookingReference: string | null;
  usageType: string;
  customerInsured: boolean;
  repairable: boolean;
  totalLoss: boolean;
  canRepairOnSite: boolean;
  needsSpareParts: boolean;
  sparePartsNeeded: string | null;
  stationId: number | null;
  status: string;
  repairId: number | null;
  reporterName: string;
  equipmentLabel: string;
  stationName?: string;
  photos: { id: number; url: string; uploadedAt: string | null }[];
};

function formatDate(ts: string | null) {
  if (!ts) return "–";
  return new Date(ts).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }) +
    " " + new Date(ts).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    open: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    in_review: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    resolved: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  };
  const label: Record<string, string> = { open: "Open", in_review: "In Review", resolved: "Resolved" };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${map[status] || "bg-muted text-muted-foreground"}`}>
      {label[status] || status}
    </span>
  );
}

function ReportCard({ report, isHamburg }: { report: DamageReport; isHamburg: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const { toast } = useToast();

  const statusMutation = useMutation({
    mutationFn: (status: string) => apiRequest("PATCH", `/api/damage-reports/${report.id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/damage-reports"] });
      toast({ title: "Status updated" });
    },
  });

  return (
    <Card className={`border-l-4 ${report.totalLoss ? "border-l-red-600" : report.repairable ? "border-l-orange-400" : "border-l-yellow-400"}`} data-testid={`card-damage-report-${report.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-1.5 mb-1.5">
              {report.totalLoss && <span className="text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 rounded-full">Total Loss</span>}
              {!report.totalLoss && report.repairable && <span className="text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 px-2 py-0.5 rounded-full">Repairable</span>}
              {!report.totalLoss && !report.repairable && <span className="text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 px-2 py-0.5 rounded-full">Not Repairable</span>}
              <StatusPill status={report.status} />
              {report.repairId && <span className="text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 px-2 py-0.5 rounded-full">Repair #{report.repairId}</span>}
            </div>
            <Link href={`/equipment/${report.equipmentId}`}>
              <p className="font-semibold text-sm hover:text-primary transition-colors" data-testid={`text-damage-equipment-${report.id}`}>{report.equipmentLabel}</p>
            </Link>
            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{report.howItHappened}</p>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5 text-xs text-muted-foreground">
              {report.stationName && <span>📍 {report.stationName}</span>}
              <span>By {report.reporterName}</span>
              <span>{formatDate(report.reportedAt)}</span>
              {report.photos.length > 0 && (
                <span className="flex items-center gap-1"><ImageIcon className="h-3 w-3" /> {report.photos.length} photo(s)</span>
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon" className="shrink-0" onClick={() => setExpanded(e => !e)} data-testid={`button-expand-report-${report.id}`}>
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>

        {expanded && (
          <div className="mt-4 pt-4 border-t space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Usage type</p>
                <p className="font-medium capitalize">{report.usageType === "lesson" ? "Lesson (our liability)" : report.usageType === "rental" ? "Rental" : "Other"}</p>
              </div>
              {report.customerName && (
                <div>
                  <p className="text-xs text-muted-foreground">Customer</p>
                  <p className="font-medium">{report.customerName}</p>
                </div>
              )}
              {report.bookingReference && (
                <div>
                  <p className="text-xs text-muted-foreground">Booking ref</p>
                  <p className="font-medium font-mono">{report.bookingReference}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground">Customer insured</p>
                <p className="font-medium">{report.customerInsured ? "Yes" : "No"}</p>
              </div>
              {!report.totalLoss && (
                <>
                  <div>
                    <p className="text-xs text-muted-foreground">On-site repair possible</p>
                    <p className="font-medium">{report.canRepairOnSite ? "Yes" : "No"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Needs spare parts</p>
                    <p className="font-medium">{report.needsSpareParts ? "Yes" : "No"}</p>
                  </div>
                  {report.needsSpareParts && report.sparePartsNeeded && (
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground">Parts needed</p>
                      <p className="font-medium">{report.sparePartsNeeded}</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {report.photos.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Damage photos</p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {report.photos.map(p => (
                    <a key={p.id} href={p.url} target="_blank" rel="noreferrer">
                      <img src={p.url} className="h-24 w-24 rounded-lg object-cover shrink-0 border" alt="Damage" data-testid={`img-damage-photo-${p.id}`} />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {isHamburg && (
              <div className="flex items-center gap-2 pt-1">
                <p className="text-xs text-muted-foreground">Change status:</p>
                {["open", "in_review", "resolved"].map(s => (
                  <Button
                    key={s}
                    size="sm"
                    variant={report.status === s ? "default" : "outline"}
                    onClick={() => statusMutation.mutate(s)}
                    disabled={statusMutation.isPending || report.status === s}
                    data-testid={`button-status-${s}-${report.id}`}
                  >
                    {s === "open" ? "Open" : s === "in_review" ? "In Review" : "Resolved"}
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DamageReportForm({ equipmentId, stationId, onSuccess, onCancel }: {
  equipmentId?: number;
  stationId?: number | null;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [uploadedPhotos, setUploadedPhotos] = useState<{ id: number; url: string }[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [pendingReportId, setPendingReportId] = useState<number | null>(null);

  const { data: equipmentList } = useQuery<Equipment[]>({ queryKey: ["/api/equipment"] });
  const { data: stationsList } = useQuery<Station[]>({ queryKey: ["/api/stations"] });

  const [form, setForm] = useState({
    equipmentId: equipmentId ?? 0,
    howItHappened: "",
    customerName: "",
    bookingReference: "",
    usageType: "rental" as "rental" | "lesson" | "other",
    customerInsured: false,
    repairable: true,
    totalLoss: false,
    canRepairOnSite: false,
    needsSpareParts: false,
    sparePartsNeeded: "",
    stationId: stationId ?? (user as any)?.stationId ?? null,
  });

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const submitMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/damage-reports", {
      ...form,
      equipmentId: Number(form.equipmentId),
      stationId: form.stationId ? Number(form.stationId) : null,
      customerName: form.customerName || null,
      bookingReference: form.bookingReference || null,
      sparePartsNeeded: form.needsSpareParts ? form.sparePartsNeeded : null,
    }),
    onSuccess: async (report: any) => {
      setPendingReportId(report.id);
      queryClient.invalidateQueries({ queryKey: ["/api/damage-reports"] });
      queryClient.invalidateQueries({ queryKey: ["/api/equipment", String(form.equipmentId), "damage-reports"] });
      setStep(2);
    },
    onError: () => toast({ title: "Failed to submit", variant: "destructive" }),
  });

  const uploadPhoto = async (file: File) => {
    if (!pendingReportId) return;
    setUploadingPhoto(true);
    try {
      const urlRes = await fetch(`/api/damage-reports/${pendingReportId}/photos/upload-url`, { credentials: "include" });
      const { uploadURL, objectPath } = await urlRes.json();
      await fetch(uploadURL, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      const photoRes = await apiRequest("POST", `/api/damage-reports/${pendingReportId}/photos`, { url: objectPath });
      setUploadedPhotos(prev => [...prev, { id: (photoRes as any).id, url: objectPath }]);
      queryClient.invalidateQueries({ queryKey: ["/api/damage-reports"] });
    } catch {
      toast({ title: "Photo upload failed", variant: "destructive" });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadPhoto(file);
    e.target.value = "";
  };

  const canSubmitStep1 = form.equipmentId > 0 && form.howItHappened.length >= 5;

  if (step === 2) {
    return (
      <div className="space-y-5">
        <div className="flex flex-col items-center text-center gap-3 pt-2">
          <div className="h-14 w-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CheckCircle2 className="h-7 w-7 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Damage Report Submitted</h3>
            <p className="text-sm text-muted-foreground mt-1">The admin has been notified. Add up to 3 damage photos below.</p>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium mb-3">Damage Photos ({uploadedPhotos.length}/3)</p>
          <div className="flex gap-2 flex-wrap mb-3">
            {uploadedPhotos.map(p => (
              <img key={p.id} src={p.url} className="h-20 w-20 rounded-lg object-cover border" alt="Damage" />
            ))}
            {uploadingPhoto && (
              <div className="h-20 w-20 rounded-lg border-2 border-dashed border-muted flex items-center justify-center">
                <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              </div>
            )}
          </div>

          {uploadedPhotos.length < 3 && (
            <div className="flex gap-2">
              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => cameraInputRef.current?.click()}
                disabled={uploadingPhoto}
                data-testid="button-take-damage-photo"
              >
                <Camera className="h-4 w-4" />
                Take Photo
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                data-testid="button-upload-damage-photo"
              >
                <Upload className="h-4 w-4" />
                Upload
              </Button>
            </div>
          )}
        </div>

        <Button className="w-full" onClick={onSuccess} data-testid="button-done-damage-report">
          Done
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <div>
          <Label htmlFor="dr-equipment" className="text-sm font-medium">Equipment *</Label>
          {equipmentId ? (
            <p className="font-medium mt-1">{equipmentList?.find(e => e.id === equipmentId)?.brand ?? ""} {equipmentList?.find(e => e.id === equipmentId)?.model ?? ""}</p>
          ) : (
            <Select value={String(form.equipmentId || "")} onValueChange={v => set("equipmentId", Number(v))}>
              <SelectTrigger className="mt-1" data-testid="select-damage-equipment">
                <SelectValue placeholder="Select equipment…" />
              </SelectTrigger>
              <SelectContent>
                {equipmentList?.filter(e => e.status === "active" || e.status === "in_transfer").map(e => (
                  <SelectItem key={e.id} value={String(e.id)}>{e.brand} {e.model} – {(e.typeSpecificFields as any)?.size ?? ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div>
          <Label htmlFor="dr-how" className="text-sm font-medium">What happened? *</Label>
          <Textarea
            id="dr-how"
            className="mt-1"
            rows={4}
            placeholder="Describe what happened in detail…"
            value={form.howItHappened}
            onChange={e => set("howItHappened", e.target.value)}
            data-testid="textarea-how-it-happened"
          />
        </div>

        <div>
          <Label htmlFor="dr-usage" className="text-sm font-medium">Usage type *</Label>
          <Select value={form.usageType} onValueChange={v => set("usageType", v)}>
            <SelectTrigger className="mt-1" data-testid="select-usage-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rental">Rental – customer pays</SelectItem>
              <SelectItem value="lesson">Lesson – our liability</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="dr-customer" className="text-sm font-medium">Customer name</Label>
            <Input id="dr-customer" className="mt-1" placeholder="Full name" value={form.customerName} onChange={e => set("customerName", e.target.value)} data-testid="input-customer-name" />
          </div>
          <div>
            <Label htmlFor="dr-booking" className="text-sm font-medium">Booking ref</Label>
            <Input id="dr-booking" className="mt-1" placeholder="e.g. BK-1234" value={form.bookingReference} onChange={e => set("bookingReference", e.target.value)} data-testid="input-booking-reference" />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <p className="text-sm font-medium">Customer has insurance</p>
            <p className="text-xs text-muted-foreground">Does the customer have their own insurance?</p>
          </div>
          <Switch checked={form.customerInsured} onCheckedChange={v => set("customerInsured", v)} data-testid="switch-customer-insured" />
        </div>
      </div>

      <div className="border-t pt-4 space-y-3">
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Assessment</p>

        <div className="flex items-center justify-between rounded-lg border p-3 border-red-200 dark:border-red-800">
          <div>
            <p className="text-sm font-medium text-red-700 dark:text-red-400">Total Loss</p>
            <p className="text-xs text-muted-foreground">Equipment is beyond repair</p>
          </div>
          <Switch
            checked={form.totalLoss}
            onCheckedChange={v => { set("totalLoss", v); if (v) { set("repairable", false); set("canRepairOnSite", false); set("needsSpareParts", false); } }}
            data-testid="switch-total-loss"
          />
        </div>

        {!form.totalLoss && (
          <>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Repairable</p>
                <p className="text-xs text-muted-foreground">Can this equipment be repaired?</p>
              </div>
              <Switch checked={form.repairable} onCheckedChange={v => set("repairable", v)} data-testid="switch-repairable" />
            </div>

            {form.repairable && (
              <>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">Can repair on-site</p>
                    <p className="text-xs text-muted-foreground">Fixable at this location</p>
                  </div>
                  <Switch checked={form.canRepairOnSite} onCheckedChange={v => set("canRepairOnSite", v)} data-testid="switch-repair-onsite" />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">Needs spare parts</p>
                    <p className="text-xs text-muted-foreground">Requires ordering parts</p>
                  </div>
                  <Switch checked={form.needsSpareParts} onCheckedChange={v => set("needsSpareParts", v)} data-testid="switch-needs-parts" />
                </div>

                {form.needsSpareParts && (
                  <div>
                    <Label htmlFor="dr-parts" className="text-sm font-medium">Which spare parts?</Label>
                    <Textarea
                      id="dr-parts"
                      className="mt-1"
                      rows={2}
                      placeholder="List the parts needed…"
                      value={form.sparePartsNeeded}
                      onChange={e => set("sparePartsNeeded", e.target.value)}
                      data-testid="textarea-spare-parts"
                    />
                  </div>
                )}
              </>
            )}
          </>
        )}

        {form.stationId == null && stationsList && (
          <div>
            <Label className="text-sm font-medium">Location</Label>
            <Select value={form.stationId ? String(form.stationId) : ""} onValueChange={v => set("stationId", Number(v))}>
              <SelectTrigger className="mt-1" data-testid="select-damage-station">
                <SelectValue placeholder="Select location…" />
              </SelectTrigger>
              <SelectContent>
                {stationsList.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-2">
        <Button variant="outline" className="flex-1" onClick={onCancel} data-testid="button-cancel-damage-report">Cancel</Button>
        <Button
          className="flex-1"
          variant="destructive"
          disabled={!canSubmitStep1 || submitMutation.isPending}
          onClick={() => submitMutation.mutate()}
          data-testid="button-submit-damage-report"
        >
          {submitMutation.isPending ? "Submitting…" : "Submit Report"}
        </Button>
      </div>
    </div>
  );
}

export default function IncidentsPage() {
  const { isHamburg, user } = useAuth();
  const [location] = useLocation();
  const { toast } = useToast();

  const urlParams = new URLSearchParams(location.split("?")[1] || "");
  const preselectedEquipmentId = urlParams.get("equipment") ? Number(urlParams.get("equipment")) : undefined;

  const [showForm, setShowForm] = useState(!!preselectedEquipmentId);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchText, setSearchText] = useState("");

  const { data: reports, isLoading } = useQuery<DamageReport[]>({
    queryKey: ["/api/damage-reports"],
    queryFn: () => fetch("/api/damage-reports", { credentials: "include" }).then(r => r.json()),
    staleTime: 0,
  });

  const { data: equipment } = useQuery<Equipment[]>({ queryKey: ["/api/equipment"] });

  const preselectedEquipment = preselectedEquipmentId ? equipment?.find(e => e.id === preselectedEquipmentId) : undefined;
  const preselectedStationId = preselectedEquipment?.currentStationId ?? (user as any)?.stationId ?? null;

  const filtered = (reports || []).filter(r => {
    if (filterStatus !== "all" && r.status !== filterStatus) return false;
    if (searchText) {
      const q = searchText.toLowerCase();
      if (!r.equipmentLabel.toLowerCase().includes(q) &&
        !r.howItHappened.toLowerCase().includes(q) &&
        !(r.customerName?.toLowerCase().includes(q)) &&
        !(r.stationName?.toLowerCase().includes(q))) return false;
    }
    return true;
  });

  const openCount = (reports || []).filter(r => r.status === "open").length;

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            Damage Incidents
          </h1>
          {openCount > 0 && (
            <p className="text-sm text-muted-foreground mt-0.5">{openCount} open incident{openCount !== 1 ? "s" : ""}</p>
          )}
        </div>
        <Button
          variant="destructive"
          className="gap-2"
          onClick={() => setShowForm(true)}
          data-testid="button-new-incident"
        >
          <Plus className="h-4 w-4" />
          Report Damage
        </Button>
      </div>

      <Dialog open={showForm} onOpenChange={open => { if (!open) setShowForm(false); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              New Damage Report
              {preselectedEquipment && <span className="font-normal text-muted-foreground">– {preselectedEquipment.brand} {preselectedEquipment.model}</span>}
            </DialogTitle>
          </DialogHeader>
          <DamageReportForm
            equipmentId={preselectedEquipmentId}
            stationId={preselectedStationId}
            onSuccess={() => {
              setShowForm(false);
              queryClient.invalidateQueries({ queryKey: ["/api/damage-reports"] });
            }}
            onCancel={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search incidents…"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            data-testid="input-search-incidents"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36" data-testid="select-filter-status">
            <Filter className="h-4 w-4 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_review">In Review</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <AlertTriangle className="h-10 w-10 mx-auto mb-3 opacity-20" />
          <p className="font-medium">{reports?.length === 0 ? "No damage incidents yet" : "No results match your filters"}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => (
            <ReportCard key={r.id} report={r} isHamburg={isHamburg} />
          ))}
        </div>
      )}
    </div>
  );
}
