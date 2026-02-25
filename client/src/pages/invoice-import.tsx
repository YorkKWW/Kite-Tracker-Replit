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
  Plus, ChevronRight, SkipForward, Loader2,
} from "lucide-react";
import type { Supplier } from "@shared/schema";

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

const SUPPLIER_COLORS = [
  "#f97316", "#0ea5e9", "#8b5cf6", "#10b981",
  "#ef4444", "#f59e0b", "#06b6d4", "#ec4899",
];

export default function InvoiceImportPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(null);
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState("");
  const [newSupplierColor, setNewSupplierColor] = useState(SUPPLIER_COLORS[0]);

  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [items, setItems] = useState<ParsedItem[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; errors: string[] } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  const addSupplierMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/suppliers", { name: newSupplierName, color: newSupplierColor }).then((r) => r.json()),
    onSuccess: (s: Supplier) => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      setSelectedSupplierId(s.id);
      setShowAddSupplier(false);
      setNewSupplierName("");
      toast({ title: "Supplier added" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
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
            {suppliers.map((s) => (
              <button
                key={s.id}
                data-testid={`card-supplier-${s.id}`}
                onClick={() => setSelectedSupplierId(s.id)}
                className={`rounded-xl border-2 p-4 flex flex-col items-center gap-2 transition-all ${
                  selectedSupplierId === s.id
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
                {selectedSupplierId === s.id && (
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                )}
              </button>
            ))}

            {!showAddSupplier && (
              <button
                data-testid="button-add-supplier"
                onClick={() => setShowAddSupplier(true)}
                className="rounded-xl border-2 border-dashed border-border p-4 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-primary transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <Plus className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium">Add Supplier</span>
              </button>
            )}
          </div>

          {showAddSupplier && (
            <Card>
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold text-sm">New Supplier</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Name</Label>
                    <Input
                      value={newSupplierName}
                      onChange={(e) => setNewSupplierName(e.target.value)}
                      placeholder="e.g. Ozone, Cabrinha"
                      data-testid="input-supplier-name"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Color</Label>
                    <div className="flex gap-2 flex-wrap">
                      {SUPPLIER_COLORS.map((c) => (
                        <button
                          key={c}
                          onClick={() => setNewSupplierColor(c)}
                          className={`w-7 h-7 rounded-full border-2 transition-all ${newSupplierColor === c ? "border-foreground scale-110" : "border-transparent"}`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => addSupplierMutation.mutate()}
                    disabled={!newSupplierName.trim() || addSupplierMutation.isPending}
                    data-testid="button-save-supplier"
                  >
                    {addSupplierMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowAddSupplier(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

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
            className="border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
            data-testid="card-pdf-upload"
          >
            <CardContent className="p-12 flex flex-col items-center gap-3 text-center">
              {isParsing ? (
                <>
                  <Loader2 className="h-12 w-12 text-primary animate-spin" />
                  <p className="font-medium">Parsing PDF…</p>
                  <p className="text-sm text-muted-foreground">Extracting line items and serial numbers</p>
                </>
              ) : (
                <>
                  <FileText className="h-12 w-12 text-muted-foreground" />
                  <p className="font-semibold text-lg">Drop PDF invoice here</p>
                  <p className="text-sm text-muted-foreground">or click to select file</p>
                  <Button variant="outline" size="sm" className="mt-2 gap-2" data-testid="button-select-pdf">
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
                className={`${item.skip ? "opacity-50" : ""} ${item.isDuplicate && !item.skip ? "border-orange-400" : ""}`}
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
                        {item.isDuplicate && !item.skip && (
                          <Badge variant="destructive" className="text-xs gap-1">
                            <AlertTriangle className="h-3 w-3" /> Duplicate serial
                          </Badge>
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
    </div>
  );
}
