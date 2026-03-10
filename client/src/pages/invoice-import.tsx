import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { EQUIPMENT_TYPE_LABELS } from "@shared/schema";
import {
  ArrowLeft, Upload, FileText, CheckCircle2, AlertTriangle,
  ChevronRight, ChevronDown, SkipForward, Loader2, Package, Receipt, Trash2,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import type { Supplier, Equipment, Invoice } from "@shared/schema";

type ParsedItem = {
  sku: string;
  name: string;
  size: string;
  color: string;
  quantity: number;
  discount: number;
  unitPriceAfterDiscount: number;
  serialNumber: string;
  type: string;
  isSpare: boolean;
  isDuplicate: boolean;
  duplicateId: number | null;
  skip: boolean;
};

type ParseResult = {
  invoiceNumber: string;
  invoiceDate: string;
  deliveryDate: string;
  orderNumber: string;
  totalNet: number | null;
  totalGross: number | null;
  items: ParsedItem[];
};

const STEP_LABELS = ["Select Supplier", "Upload PDF", "Review Items", "Done"];

export default function InvoiceImportPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(null);

  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [items, setItems] = useState<ParsedItem[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; errors: string[] } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (isParsing) return;
    const file = e.dataTransfer.files[0];
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      toast({ title: "Wrong file type", description: "Please drop a PDF file.", variant: "destructive" });
      return;
    }
    handlePdfUpload(file);
  };

  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  const confirmMutation = useMutation({
    mutationFn: () => {
      const supplier = suppliers.find((s) => s.id === selectedSupplierId);
      return apiRequest("POST", "/api/invoices/confirm", {
        supplierId: selectedSupplierId,
        brand: supplier?.name || "",
        invoiceNumber: parseResult?.invoiceNumber,
        invoiceDate: parseResult?.invoiceDate,
        deliveryDate: parseResult?.deliveryDate,
        orderNumber: parseResult?.orderNumber,
        totalNet: parseResult?.totalNet,
        totalGross: parseResult?.totalGross,
        items,
      }).then((r) => r.json());
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      setImportResult(result);
      setStep(4);
    },
    onError: (e: any) => toast({ title: "Import failed", description: e.message, variant: "destructive" }),
  });

  async function handlePdfUpload(file: File) {
    setIsParsing(true);
    try {
      const formData = new FormData();
      formData.append("pdf", file);
      const res = await fetch("/api/invoices/parse", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Parse failed");
      }
      const data: ParseResult = await res.json();
      setParseResult(data);
      setItems(data.items);
      setStep(3);
    } catch (e: any) {
      toast({ title: "PDF parse error", description: e.message, variant: "destructive" });
    } finally {
      setIsParsing(false);
    }
  }

  function updateItem(idx: number, field: keyof ParsedItem, value: any) {
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  }

  const selectedSupplier = suppliers.find((s) => s.id === selectedSupplierId);
  const includedCount = items.filter((i) => !i.skip).length;
  const skippedCount = items.filter((i) => i.skip).length;
  const duplicateCount = items.filter((i) => i.isDuplicate && !i.skip).length;

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/equipment">
          <Button variant="ghost" size="icon" data-testid="button-back-invoice">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold">Import Invoice</h1>
          <p className="text-sm text-muted-foreground">Bulk-create equipment from a supplier invoice PDF</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1">
        {STEP_LABELS.map((label, i) => {
          const num = i + 1;
          const active = step === num;
          const done = step > num;
          return (
            <div key={num} className="flex items-center gap-1 flex-1">
              <div className={`flex items-center gap-1.5 ${active ? "text-primary" : done ? "text-green-500" : "text-muted-foreground"}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${active ? "bg-primary text-primary-foreground" : done ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"}`}>
                  {done ? "✓" : num}
                </div>
                <span className="text-xs font-medium hidden sm:inline">{label}</span>
              </div>
              {i < STEP_LABELS.length - 1 && <div className="flex-1 h-px bg-border mx-1" />}
            </div>
          );
        })}
      </div>

      {/* ─── Step 1: Select Supplier ─────────────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Choose the supplier for this invoice.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {suppliers.map((s) => {
              const supported = ["Core", "Eleveight"].includes(s.name);
              return (
                <button
                  key={s.id}
                  data-testid={`card-supplier-${s.id}`}
                  onClick={() => supported && setSelectedSupplierId(s.id)}
                  disabled={!supported}
                  className={`rounded-xl border-2 p-4 flex flex-col items-center gap-2 transition-all ${
                    !supported
                      ? "border-border opacity-50 cursor-not-allowed"
                      : selectedSupplierId === s.id
                        ? "border-primary shadow-md"
                        : "border-border hover:border-primary/50"
                  }`}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg"
                    style={{ backgroundColor: s.color }}
                  >
                    {s.name[0]}
                  </div>
                  <span className="font-semibold text-sm">{s.name}</span>
                  {!supported && (
                    <span className="text-xs text-muted-foreground">Available soon</span>
                  )}
                  {supported && selectedSupplierId === s.id && (
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  )}
                </button>
              );
            })}

          </div>

          <Button
            onClick={() => setStep(2)}
            disabled={!selectedSupplierId}
            className="gap-2"
            data-testid="button-next-step1"
          >
            Continue with {selectedSupplier?.name || "..."}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* ─── Step 2: Upload PDF ───────────────────────────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs"
              style={{ backgroundColor: selectedSupplier?.color }}
            >
              {selectedSupplier?.name[0]}
            </div>
            <span className="font-medium">{selectedSupplier?.name}</span>
            <button className="text-xs text-muted-foreground underline" onClick={() => setStep(1)}>Change</button>
          </div>

          <Card
            className={`border-2 border-dashed transition-colors cursor-pointer ${
              isDragging
                ? "border-primary bg-primary/5 scale-[1.01]"
                : "border-border hover:border-primary/50"
            }`}
            onClick={() => !isParsing && fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            data-testid="card-pdf-upload"
          >
            <CardContent className="p-12 flex flex-col items-center gap-3 text-center pointer-events-none">
              {isParsing ? (
                <>
                  <Loader2 className="h-12 w-12 text-primary animate-spin" />
                  <p className="font-medium">Parsing PDF…</p>
                  <p className="text-sm text-muted-foreground">Extracting line items and serial numbers</p>
                </>
              ) : isDragging ? (
                <>
                  <FileText className="h-12 w-12 text-primary" />
                  <p className="font-semibold text-lg text-primary">Release to upload</p>
                </>
              ) : (
                <>
                  <FileText className="h-12 w-12 text-muted-foreground" />
                  <p className="font-semibold text-lg">Drop PDF invoice here</p>
                  <p className="text-sm text-muted-foreground">or click to select file</p>
                  <Button variant="outline" size="sm" className="mt-2 gap-2 pointer-events-auto" data-testid="button-select-pdf">
                    <Upload className="h-4 w-4" />
                    Select PDF
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            data-testid="input-pdf-file"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handlePdfUpload(file);
            }}
          />

          <Button variant="ghost" onClick={() => setStep(1)} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
      )}

      {/* ─── Step 3: Review ───────────────────────────────────────────────────────── */}
      {step === 3 && parseResult && (
        <div className="space-y-4">
          {/* Invoice metadata */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Invoice No.</p>
                  <p className="font-mono font-semibold" data-testid="text-invoice-number">{parseResult.invoiceNumber || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Date</p>
                  <p className="font-semibold">{parseResult.invoiceDate || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Order No.</p>
                  <p className="font-semibold">{parseResult.orderNumber || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Total (net)</p>
                  <p className="font-semibold">{parseResult.totalNet != null ? `€${parseResult.totalNet.toFixed(2)}` : "—"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary bar */}
          <div className="flex flex-wrap gap-3 text-sm">
            <Badge variant="default" className="gap-1">
              <CheckCircle2 className="h-3 w-3" />
              {includedCount} to import
            </Badge>
            {skippedCount > 0 && (
              <Badge variant="secondary" className="gap-1">
                <SkipForward className="h-3 w-3" />
                {skippedCount} skipped
              </Badge>
            )}
            {duplicateCount > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                {duplicateCount} duplicates (will overwrite)
              </Badge>
            )}
          </div>

          {/* Review table */}
          <div className="space-y-2">
            {items.map((item, idx) => (
              <Card
                key={idx}
                className={`${item.skip && !item.isDuplicate ? "opacity-50" : ""} ${item.isDuplicate ? "border-red-400 dark:border-red-600" : ""}`}
                data-testid={`card-item-${idx}`}
              >
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={!item.skip}
                      onCheckedChange={(v) => updateItem(idx, "skip", !v)}
                      data-testid={`checkbox-include-${idx}`}
                      className="mt-1 shrink-0"
                    />
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded font-bold" data-testid={`text-item-sku-${idx}`}>
                          {item.sku}
                        </span>
                        <span className="font-semibold text-sm truncate">{item.name}</span>
                        {item.size && <span className="text-xs text-muted-foreground">{item.size}m²</span>}
                        {item.color && <span className="text-xs text-muted-foreground">{item.color}</span>}
                        {item.isSpare && <Badge variant="secondary" className="text-xs">Spare Part</Badge>}
                        {item.isDuplicate && (
                          <span className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 font-medium">
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                            Serial already exists —{" "}
                            <a
                              href={`/equipment/${item.duplicateId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline hover:no-underline"
                              data-testid={`link-duplicate-${idx}`}
                            >
                              view existing item
                            </a>
                            {item.skip && <span className="text-muted-foreground font-normal">(skipped by default)</span>}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Serial Number</Label>
                          <Input
                            value={item.serialNumber}
                            onChange={(e) => updateItem(idx, "serialNumber", e.target.value)}
                            className="h-7 text-xs font-mono"
                            data-testid={`input-serial-${idx}`}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Type</Label>
                          <Select
                            value={item.type}
                            onValueChange={(v) => updateItem(idx, "type", v)}
                          >
                            <SelectTrigger className="h-7 text-xs" data-testid={`select-type-${idx}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(EQUIPMENT_TYPE_LABELS).map(([k, v]) => (
                                <SelectItem key={k} value={k}>{v}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Purchase Price (€)</Label>
                          <Input
                            type="number"
                            value={item.unitPriceAfterDiscount}
                            onChange={(e) => updateItem(idx, "unitPriceAfterDiscount", parseFloat(e.target.value) || 0)}
                            className="h-7 text-xs"
                            data-testid={`input-price-${idx}`}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Discount</Label>
                          <div className="h-7 flex items-center text-xs text-muted-foreground px-2 border rounded-md bg-muted/50">
                            {item.discount}%
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex gap-3 flex-wrap">
            <Button
              onClick={() => confirmMutation.mutate()}
              disabled={includedCount === 0 || confirmMutation.isPending}
              className="gap-2"
              data-testid="button-confirm-import"
            >
              {confirmMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Import {includedCount} item{includedCount !== 1 ? "s" : ""}
            </Button>
            <Button variant="ghost" onClick={() => setStep(2)} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Upload different PDF
            </Button>
          </div>
        </div>
      )}

      {/* ─── Step 4: Done ─────────────────────────────────────────────────────────── */}
      {step === 4 && importResult && (
        <div className="flex flex-col items-center gap-6 py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
            <CheckCircle2 className="h-9 w-9 text-green-500" />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-bold" data-testid="text-import-success">
              {importResult.imported} item{importResult.imported !== 1 ? "s" : ""} imported
            </h2>
            <p className="text-muted-foreground">
              Equipment added to the warehouse (unassigned). Go to Equipment to assign them to stations.
            </p>
          </div>

          {importResult.errors.length > 0 && (
            <Card className="border-orange-300 w-full max-w-md">
              <CardHeader className="pb-2">
                <p className="text-sm font-semibold text-orange-600">
                  {importResult.errors.length} item{importResult.errors.length !== 1 ? "s" : ""} had errors:
                </p>
              </CardHeader>
              <CardContent>
                <ul className="text-xs text-left space-y-1 text-muted-foreground">
                  {importResult.errors.map((e, i) => (
                    <li key={i}>• {e}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-3">
            <Button onClick={() => navigate("/equipment")} data-testid="button-go-equipment">
              Go to Equipment
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setStep(1);
                setSelectedSupplierId(null);
                setParseResult(null);
                setItems([]);
                setImportResult(null);
              }}
              data-testid="button-import-another"
            >
              Import Another Invoice
            </Button>
          </div>
        </div>
      )}
      <ImportedInvoicesSection />
    </div>
  );
}

type InvoiceWithSupplier = Invoice & { supplierName: string; importedByName: string | null };

function ImportedInvoicesSection() {
  const { data: invoicesList, isLoading } = useQuery<InvoiceWithSupplier[]>({
    queryKey: ["/api/invoices"],
    staleTime: 0,
  });
  const [expandedId, setExpandedId] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="mt-8 flex items-center justify-center py-8 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading invoices…
      </div>
    );
  }

  if (!invoicesList || invoicesList.length === 0) return null;

  return (
    <div className="mt-8 space-y-3" data-testid="imported-invoices-section">
      <h2 className="text-base font-semibold flex items-center gap-2">
        <Receipt className="h-4 w-4" />
        Imported Invoices
        <Badge variant="secondary" className="text-xs">{invoicesList.length}</Badge>
      </h2>

      <div className="space-y-2">
        {invoicesList.map((inv) => (
          <InvoiceRow
            key={inv.id}
            invoice={inv}
            isExpanded={expandedId === inv.id}
            onToggle={() => setExpandedId(expandedId === inv.id ? null : inv.id)}
          />
        ))}
      </div>
    </div>
  );
}

function InvoiceRow({ invoice, isExpanded, onToggle }: {
  invoice: InvoiceWithSupplier;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const [, navigate] = useLocation();
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { data: eqItems, isLoading, isError } = useQuery<Equipment[]>({
    queryKey: [`/api/invoices/${invoice.id}/equipment`],
    enabled: isExpanded,
    staleTime: 60_000,
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/invoices/${invoice.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      toast({ title: "Invoice deleted", description: `Invoice ${invoice.invoiceNumber} has been deleted. Equipment items are preserved.` });
      setConfirmDelete(false);
    },
    onError: (e: any) => toast({ title: "Delete failed", description: e.message, variant: "destructive" }),
  });

  const fmtDate = (d: string | null | undefined) => {
    if (!d) return "—";
    const p = new Date(d);
    return isNaN(p.getTime()) ? d : p.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const fmtPrice = (v: string | null | undefined) => {
    if (!v) return "—";
    const n = parseFloat(v);
    return isNaN(n) ? "—" : `€${n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <Card
      className="overflow-hidden"
      data-testid={`invoice-card-${invoice.id}`}
    >
      <button
        onClick={onToggle}
        className="w-full text-left px-3 py-2.5 flex items-center gap-2 hover:bg-muted/50 transition-colors"
        data-testid={`button-toggle-invoice-${invoice.id}`}
      >
        {isExpanded ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm" data-testid={`text-invoice-number-${invoice.id}`}>{invoice.invoiceNumber}</span>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">{invoice.supplierName}</Badge>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
            <span>{fmtDate(invoice.invoiceDate)}</span>
            <span>{invoice.itemCount ?? 0} items</span>
            <span className="font-medium text-foreground">{fmtPrice(invoice.totalGross)}</span>
          </div>
          {(invoice.importedByName || invoice.importedAt) && (
            <div className="text-[10px] text-muted-foreground mt-0.5">
              Imported{invoice.importedByName ? ` by ${invoice.importedByName}` : ""}{invoice.importedAt ? ` on ${fmtDate(typeof invoice.importedAt === "string" ? invoice.importedAt : new Date(invoice.importedAt).toISOString())}` : ""}
            </div>
          )}
        </div>
      </button>

      {isAdmin && isExpanded && !confirmDelete && (
        <div className="px-3 pb-1 flex justify-end">
          <button
            onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
            className="text-[10px] text-red-500 hover:text-red-700 flex items-center gap-1"
            data-testid={`button-delete-invoice-${invoice.id}`}
          >
            <Trash2 className="h-3 w-3" /> Delete Invoice
          </button>
        </div>
      )}

      {confirmDelete && (
        <div className="px-3 py-2 border-t bg-red-50 dark:bg-red-950/30 flex items-center gap-2 text-xs">
          <span className="text-red-700 dark:text-red-400 flex-1">Delete this invoice? Equipment items will be preserved.</span>
          <Button
            size="sm"
            variant="destructive"
            className="h-7 text-xs"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
            data-testid={`button-confirm-delete-invoice-${invoice.id}`}
          >
            {deleteMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Delete"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => setConfirmDelete(false)}
            data-testid={`button-cancel-delete-invoice-${invoice.id}`}
          >
            Cancel
          </Button>
        </div>
      )}

      {isExpanded && !confirmDelete && (
        <div className="border-t bg-muted/20 px-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-4 text-muted-foreground text-sm">
              <Loader2 className="h-3 w-3 animate-spin mr-2" /> Loading items…
            </div>
          ) : isError ? (
            <div className="py-4 text-center text-sm text-red-500">Failed to load items.</div>
          ) : !eqItems || eqItems.length === 0 ? (
            <div className="py-4 text-center text-sm text-muted-foreground">No equipment items found for this invoice.</div>
          ) : (
            <table className="w-full text-xs">
              <tbody>
                {eqItems.map((eq) => (
                  <tr
                    key={eq.id}
                    className="border-t cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => navigate(`/equipment/${eq.id}`)}
                    data-testid={`row-invoice-equipment-${eq.id}`}
                  >
                    <td className="px-2 py-1.5">
                      <Badge variant="secondary" className="text-[9px] px-1 py-0">
                        {EQUIPMENT_TYPE_LABELS[eq.type] ?? eq.type}
                      </Badge>
                    </td>
                    <td className="px-1 py-1.5 truncate max-w-[80px]">{eq.brand}</td>
                    <td className="px-1 py-1.5 truncate max-w-[100px]">{eq.model}</td>
                    <td className="px-1 py-1.5 text-muted-foreground">{eq.size || "—"}</td>
                    <td className="px-1 py-1.5 text-right font-mono">{fmtPrice(eq.purchasePrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </Card>
  );
}
