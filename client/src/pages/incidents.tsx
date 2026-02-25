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
  Search, Filter, ChevronDown, ChevronUp, Image as ImageIcon, ScanLine, MapPin,
  Receipt, ExternalLink, FileDown,
} from "lucide-react";
import type { Equipment, Station } from "@shared/schema";
import { Link } from "wouter";
import { BarcodeScanner } from "@/components/barcode-scanner";
import { cn } from "@/lib/utils";

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
  estimatedRepairCost: string | null;
  estimatedValueLoss: string | null;
  invoiceId?: number;
  invoiceNumber?: string;
  invoicePdfUrl?: string;
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

function InvoiceDialog({ report, open, onClose }: { report: DamageReport; open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [customerType, setCustomerType] = useState<"kww" | "external">(
    report.bookingReference ? "kww" : "external"
  );
  const [form, setForm] = useState({
    customerName: report.customerName || "",
    companyName: "",
    address: "",
    email: "",
    taxId: "",
    bookingNumber: report.bookingReference || "",
    repairCost: report.estimatedRepairCost ? parseFloat(report.estimatedRepairCost).toFixed(2) : "",
    valueLoss: report.estimatedValueLoss ? parseFloat(report.estimatedValueLoss).toFixed(2) : "",
    vatType: "standard_19",
    paymentMethod: "bank_transfer",
    notes: "",
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const invoiceMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/damage-reports/${report.id}/invoice`, {
      customerType,
      ...form,
    }),
    onSuccess: async (res: any) => {
      const data = await res.json();
      toast({ title: `Invoice ${data.invoiceNumber} generated`, description: "Saved under Sales." });
      queryClient.invalidateQueries({ queryKey: ["/api/damage-reports"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      onClose();
      navigate(`/sales`);
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message || "Failed to generate invoice", variant: "destructive" });
    },
  });

  const totalNet = (parseFloat(form.repairCost || "0") || 0) + (parseFloat(form.valueLoss || "0") || 0);
  const vatRate = form.vatType === "standard_19" ? 0.19 : form.vatType === "reduced_7" ? 0.07 : 0;
  const totalGross = totalNet * (1 + vatRate);

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            Generate Damage Invoice
          </DialogTitle>
        </DialogHeader>

        <div className="text-xs text-muted-foreground bg-muted/40 rounded p-3 mb-2">
          <p className="font-medium text-foreground mb-1">{report.equipmentLabel}</p>
          <p className="line-clamp-2">{report.howItHappened}</p>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-xs font-medium">Customer Type</Label>
            <div className="flex gap-2 mt-1">
              {(["kww", "external"] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setCustomerType(t)}
                  data-testid={`button-customer-type-${t}`}
                  className={`flex-1 py-2 rounded-md text-sm font-medium border transition-colors ${customerType === t ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:bg-muted"}`}
                >
                  {t === "kww" ? "KiteWorldWide" : "External Customer"}
                </button>
              ))}
            </div>
          </div>

          {customerType === "kww" && (
            <div>
              <Label className="text-xs font-medium">Booking Number <span className="text-destructive">*</span></Label>
              <Input value={form.bookingNumber} onChange={e => set("bookingNumber", e.target.value)} placeholder="BKWW-#1234" className="mt-1" data-testid="input-booking-number" />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label className="text-xs font-medium">Customer Name <span className="text-destructive">*</span></Label>
              <Input value={form.customerName} onChange={e => set("customerName", e.target.value)} placeholder="Full name" className="mt-1" data-testid="input-customer-name" />
            </div>
            <div className="col-span-2">
              <Label className="text-xs font-medium">Company Name</Label>
              <Input value={form.companyName} onChange={e => set("companyName", e.target.value)} placeholder="Optional" className="mt-1" data-testid="input-company-name" />
            </div>
            <div className="col-span-2">
              <Label className="text-xs font-medium">Address <span className="text-destructive">*</span></Label>
              <Textarea value={form.address} onChange={e => set("address", e.target.value)} placeholder={"Street & Nr.\nCity, ZIP\nCountry"} rows={3} className="mt-1" data-testid="input-address" />
            </div>
            <div>
              <Label className="text-xs font-medium">Email</Label>
              <Input value={form.email} onChange={e => set("email", e.target.value)} placeholder="Optional" className="mt-1" data-testid="input-email" />
            </div>
            <div>
              <Label className="text-xs font-medium">Tax ID / VAT No.</Label>
              <Input value={form.taxId} onChange={e => set("taxId", e.target.value)} placeholder="Optional" className="mt-1" data-testid="input-tax-id" />
            </div>
          </div>

          <div className="border-t pt-3">
            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Invoice Line Items</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium">Repair Cost (€)</Label>
                <Input type="number" min="0" step="0.01" value={form.repairCost} onChange={e => set("repairCost", e.target.value)} placeholder="0.00" className="mt-1" data-testid="input-invoice-repair-cost" />
              </div>
              <div>
                <Label className="text-xs font-medium">Value Reduction (€)</Label>
                <Input type="number" min="0" step="0.01" value={form.valueLoss} onChange={e => set("valueLoss", e.target.value)} placeholder="0.00" className="mt-1" data-testid="input-invoice-value-loss" />
              </div>
            </div>
            <div className="mt-3 p-2 bg-muted/40 rounded text-xs text-muted-foreground space-y-0.5">
              <div className="flex justify-between"><span>Net total:</span><span className="font-medium text-foreground">{totalNet.toFixed(2)} €</span></div>
              <div className="flex justify-between"><span>VAT ({form.vatType === "standard_19" ? "19%" : form.vatType === "reduced_7" ? "7%" : "0%"}):</span><span className="font-medium text-foreground">{(totalNet * vatRate).toFixed(2)} €</span></div>
              <div className="flex justify-between font-semibold text-foreground border-t pt-1 mt-1"><span>Gross total:</span><span>{totalGross.toFixed(2)} €</span></div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-medium">VAT Rate</Label>
              <Select value={form.vatType} onValueChange={v => set("vatType", v)}>
                <SelectTrigger className="mt-1" data-testid="select-vat-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard_19">19% (Standard)</SelectItem>
                  <SelectItem value="reduced_7">7% (Reduced)</SelectItem>
                  <SelectItem value="none">0% (No VAT)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium">Payment Method</Label>
              <Select value={form.paymentMethod} onValueChange={v => set("paymentMethod", v)}>
                <SelectTrigger className="mt-1" data-testid="select-payment-method"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs font-medium">Additional Notes</Label>
            <Textarea value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Optional additional notes" rows={2} className="mt-1" data-testid="input-invoice-notes" />
          </div>
        </div>

        <div className="flex gap-2 mt-4 pt-3 border-t">
          <Button variant="outline" className="flex-1" onClick={onClose} data-testid="button-cancel-invoice">Cancel</Button>
          <Button
            className="flex-1"
            onClick={() => invoiceMutation.mutate()}
            disabled={invoiceMutation.isPending || !form.customerName.trim() || !form.address.trim() || (customerType === "kww" && !form.bookingNumber.trim())}
            data-testid="button-generate-invoice"
          >
            {invoiceMutation.isPending ? "Generating…" : "Generate Invoice"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ReportCard({ report, isHamburg }: { report: DamageReport; isHamburg: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const { toast } = useToast();

  const statusMutation = useMutation({
    mutationFn: (status: string) => apiRequest("PATCH", `/api/damage-reports/${report.id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/damage-reports"] });
      toast({ title: "Status updated" });
    },
  });

  return (
    <>
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
              {report.invoiceNumber && (
                <Link href="/sales">
                  <span className="text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full flex items-center gap-1 cursor-pointer hover:opacity-80">
                    <Receipt className="h-3 w-3" /> {report.invoiceNumber}
                  </span>
                </Link>
              )}
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

            {(report.estimatedRepairCost || report.estimatedValueLoss) && (
              <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-lg p-3">
                <p className="text-xs font-semibold text-amber-800 dark:text-amber-400 mb-2">Cost Estimates</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {report.estimatedRepairCost && (
                    <div>
                      <p className="text-xs text-muted-foreground">Repair Cost</p>
                      <p className="font-medium">{parseFloat(report.estimatedRepairCost).toFixed(2)} €</p>
                    </div>
                  )}
                  {report.estimatedValueLoss && (
                    <div>
                      <p className="text-xs text-muted-foreground">Value Reduction</p>
                      <p className="font-medium">{parseFloat(report.estimatedValueLoss).toFixed(2)} €</p>
                    </div>
                  )}
                  {report.estimatedRepairCost && report.estimatedValueLoss && (
                    <div className="col-span-2 border-t pt-1 mt-1">
                      <p className="text-xs text-muted-foreground">Total (est.)</p>
                      <p className="font-semibold">{(parseFloat(report.estimatedRepairCost) + parseFloat(report.estimatedValueLoss)).toFixed(2)} €</p>
                    </div>
                  )}
                </div>
              </div>
            )}

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

            {isHamburg && report.invoiceId && (
              <div className="flex items-center gap-2 flex-wrap pt-1 border-t">
                <Receipt className="h-4 w-4 text-green-600 shrink-0" />
                <span className="text-sm font-medium text-green-700 dark:text-green-400">{report.invoiceNumber}</span>
                <div className="flex gap-2 ml-auto">
                  <Link href="/sales">
                    <Button size="sm" variant="outline" className="gap-1.5" data-testid={`button-view-invoice-${report.id}`}>
                      <ExternalLink className="h-3.5 w-3.5" /> View Invoice
                    </Button>
                  </Link>
                  <a href={`/api/sales/${report.invoiceId}/pdf`} target="_blank" rel="noreferrer">
                    <Button size="sm" variant="outline" className="gap-1.5" data-testid={`button-download-pdf-${report.id}`}>
                      <FileDown className="h-3.5 w-3.5" /> Download PDF
                    </Button>
                  </a>
                </div>
              </div>
            )}

            {isHamburg && !report.invoiceId && (
              <div className="pt-1 border-t">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 w-full sm:w-auto"
                  onClick={() => setInvoiceDialogOpen(true)}
                  data-testid={`button-open-invoice-dialog-${report.id}`}
                >
                  <Receipt className="h-3.5 w-3.5" /> Generate Customer Invoice
                </Button>
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

    {isHamburg && invoiceDialogOpen && (
      <InvoiceDialog report={report} open={invoiceDialogOpen} onClose={() => setInvoiceDialogOpen(false)} />
    )}
    </>
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
  const [scannerOpen, setScannerOpen] = useState(false);

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
    stationId: stationId ?? (user as any)?.assignedStationId ?? null,
    estimatedRepairCost: "",
    estimatedValueLoss: "",
  });

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const selectedEquipment = equipmentList?.find(e => e.id === form.equipmentId) ?? null;

  const { data: priceInfo } = useQuery<{ retailPrice: string; dealerPrice: string | null; supplier: string; productName: string } | null>({
    queryKey: ["/api/price-lists/lookup", selectedEquipment?.sku, selectedEquipment?.model, (selectedEquipment?.typeSpecificFields as any)?.size],
    queryFn: () => {
      if (!selectedEquipment) return Promise.resolve(null);
      const p = new URLSearchParams();
      if (selectedEquipment.sku) p.set("sku", selectedEquipment.sku);
      const size = (selectedEquipment.typeSpecificFields as any)?.size;
      const name = [selectedEquipment.model, size != null ? String(size) : ""].filter(Boolean).join(" ");
      if (name.length >= 3) p.set("name", name);
      if (!p.toString()) return Promise.resolve(null);
      return fetch(`/api/price-lists/lookup?${p}`, { credentials: "include" }).then(r => r.json());
    },
    enabled: !!selectedEquipment,
  });

  const submitMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/damage-reports", {
      ...form,
      equipmentId: Number(form.equipmentId),
      stationId: form.stationId ? Number(form.stationId) : null,
      customerName: form.customerName || null,
      bookingReference: form.bookingReference || null,
      sparePartsNeeded: form.needsSpareParts ? form.sparePartsNeeded : null,
      estimatedRepairCost: form.estimatedRepairCost || null,
      estimatedValueLoss: form.estimatedValueLoss || null,
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
  const MIN_PHOTOS = 3;
  const canFinish = uploadedPhotos.length >= MIN_PHOTOS;

  const handleScan = async (code: string) => {
    setScannerOpen(false);
    try {
      const res = await fetch(`/api/equipment/scan?serial=${encodeURIComponent(code)}`, { credentials: "include" });
      if (res.ok) {
        const item = await res.json();
        set("equipmentId", item.id);
        toast({ title: `Found: ${item.brand} ${item.model}` });
      } else {
        toast({ title: "Equipment not found", description: `No equipment with serial: ${code}`, variant: "destructive" });
      }
    } catch {
      toast({ title: "Scan error", variant: "destructive" });
    }
  };

  if (step === 2) {
    return (
      <div className="space-y-5">
        <div className="flex flex-col items-center text-center gap-3 pt-2">
          <div className="h-14 w-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CheckCircle2 className="h-7 w-7 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Damage Report Submitted</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Now add <strong>at least 3 damage photos</strong> before finishing.
            </p>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium">
              Damage Photos
            </p>
            <span className={`text-sm font-semibold ${canFinish ? "text-green-600 dark:text-green-400" : "text-orange-500"}`}>
              {uploadedPhotos.length} / {MIN_PHOTOS} required
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-3">
            {[0, 1, 2].map(slot => {
              const photo = uploadedPhotos[slot];
              const isUploading = uploadingPhoto && slot === uploadedPhotos.length;
              return (
                <div
                  key={slot}
                  className={`aspect-square rounded-lg border-2 overflow-hidden flex items-center justify-center
                    ${photo ? "border-green-500" : isUploading ? "border-primary border-dashed" : "border-dashed border-muted-foreground/30 bg-muted/30"}`}
                >
                  {photo ? (
                    <img src={photo.url} className="w-full h-full object-cover" alt={`Damage photo ${slot + 1}`} />
                  ) : isUploading ? (
                    <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-muted-foreground/50">
                      <Camera className="h-6 w-6" />
                      <span className="text-xs">Photo {slot + 1}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {uploadedPhotos.length < MIN_PHOTOS && (
            <div className="flex gap-2">
              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={() => cameraInputRef.current?.click()}
                disabled={uploadingPhoto}
                data-testid="button-take-damage-photo"
              >
                <Camera className="h-4 w-4" />
                Take Photo
              </Button>
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                data-testid="button-upload-damage-photo"
              >
                <Upload className="h-4 w-4" />
                Upload
              </Button>
            </div>
          )}

          {!canFinish && (
            <p className="text-xs text-orange-500 text-center mt-2">
              {MIN_PHOTOS - uploadedPhotos.length} more photo{MIN_PHOTOS - uploadedPhotos.length !== 1 ? "s" : ""} required
            </p>
          )}
        </div>

        <Button
          className="w-full"
          disabled={!canFinish}
          onClick={onSuccess}
          data-testid="button-done-damage-report"
        >
          {canFinish ? "Done — Submit Report" : `Add ${MIN_PHOTOS - uploadedPhotos.length} more photo${MIN_PHOTOS - uploadedPhotos.length !== 1 ? "s" : ""} to finish`}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <BarcodeScanner open={scannerOpen} onClose={() => setScannerOpen(false)} onScan={handleScan} />

      <div className="space-y-3">
        <div>
          <Label htmlFor="dr-equipment" className="text-sm font-medium">Equipment *</Label>
          {equipmentId ? (
            <p className="font-medium mt-1">{equipmentList?.find(e => e.id === equipmentId)?.brand ?? ""} {equipmentList?.find(e => e.id === equipmentId)?.model ?? ""}</p>
          ) : (
            <div className="flex gap-2 mt-1">
              <Select value={String(form.equipmentId || "")} onValueChange={v => set("equipmentId", Number(v))}>
                <SelectTrigger className="flex-1" data-testid="select-damage-equipment">
                  <SelectValue placeholder="Select equipment…" />
                </SelectTrigger>
                <SelectContent>
                  {equipmentList?.filter(e => e.status === "active" || e.status === "in_transfer" || e.status === "in_repair").map(e => (
                    <SelectItem key={e.id} value={String(e.id)}>
                      {e.brand} {e.model}{(e.typeSpecificFields as any)?.size ? ` – ${(e.typeSpecificFields as any).size}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setScannerOpen(true)}
                title="Scan barcode"
                data-testid="button-scan-equipment"
              >
                <ScanLine className="h-4 w-4" />
              </Button>
            </div>
          )}
          {form.equipmentId > 0 && !equipmentId && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium">
              ✓ {equipmentList?.find(e => e.id === form.equipmentId)?.brand} {equipmentList?.find(e => e.id === form.equipmentId)?.model}
            </p>
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
            <Input id="dr-booking" className="mt-1" placeholder="e.g. BKWW-#1234" value={form.bookingReference} onChange={e => set("bookingReference", e.target.value)} data-testid="input-booking-reference" />
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

                <div className={cn(
                  "rounded-lg border p-3 transition-colors",
                  form.needsSpareParts ? "border-orange-400 bg-orange-50 dark:bg-orange-950/20" : ""
                )}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Needs spare parts</p>
                      <p className="text-xs text-muted-foreground">Admin will be notified immediately</p>
                    </div>
                    <Switch checked={form.needsSpareParts} onCheckedChange={v => set("needsSpareParts", v)} data-testid="switch-needs-parts" />
                  </div>

                  {form.needsSpareParts && (
                    <div className="mt-3">
                      <Label htmlFor="dr-parts" className="text-sm font-medium text-orange-700 dark:text-orange-400">
                        Which parts are needed? <span className="text-destructive">*</span>
                      </Label>
                      <Textarea
                        id="dr-parts"
                        className="mt-1 border-orange-300 focus:border-orange-400"
                        rows={3}
                        placeholder="z.B. Bladder 9m², Leading Edge Valve, Strut Tip…"
                        value={form.sparePartsNeeded}
                        onChange={e => set("sparePartsNeeded", e.target.value)}
                        data-testid="textarea-spare-parts"
                      />
                      <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                        An e-mail and in-app notification will be sent to all admins.
                      </p>
                    </div>
                  )}
                </div>

                {/* Financial assessment */}
                <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
                  <p className="text-sm font-semibold">Cost estimate</p>

                  {/* Reference prices */}
                  {selectedEquipment && (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {priceInfo?.retailPrice && (
                        <div className="rounded-md bg-background border px-2.5 py-1.5">
                          <p className="text-muted-foreground">UVP (Retail-Price)</p>
                          <p className="font-semibold text-sm mt-0.5">€ {parseFloat(priceInfo.retailPrice).toFixed(2)}</p>
                        </div>
                      )}
                      {selectedEquipment.currentValue && (
                        <div className="rounded-md bg-background border px-2.5 py-1.5">
                          <p className="text-muted-foreground">Current value</p>
                          <p className="font-semibold text-sm mt-0.5">€ {parseFloat(selectedEquipment.currentValue).toFixed(2)}</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs font-medium">Repair cost (est.) €</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        className="mt-1 h-9"
                        placeholder="0.00"
                        value={form.estimatedRepairCost}
                        onChange={e => set("estimatedRepairCost", e.target.value)}
                        data-testid="input-repair-cost"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium">Value Reduction (est.) €</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        className="mt-1 h-9"
                        placeholder="0.00"
                        value={form.estimatedValueLoss}
                        onChange={e => set("estimatedValueLoss", e.target.value)}
                        data-testid="input-value-loss"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        <div>
          <Label className="text-sm font-medium">Location</Label>
          {form.stationId != null ? (
            <div className="mt-1 flex items-center gap-2 rounded-md border px-3 py-2 bg-muted/40">
              <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm font-medium">
                {stationsList?.find(s => s.id === form.stationId)?.name ?? `Location #${form.stationId}`}
              </span>
            </div>
          ) : stationsList ? (
            <Select value={form.stationId ? String(form.stationId) : ""} onValueChange={v => set("stationId", Number(v))}>
              <SelectTrigger className="mt-1" data-testid="select-damage-station">
                <SelectValue placeholder="Select location…" />
              </SelectTrigger>
              <SelectContent>
                {stationsList.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          ) : null}
        </div>
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
  const preselectedStationId = preselectedEquipment?.currentStationId ?? (user as any)?.assignedStationId ?? null;

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
