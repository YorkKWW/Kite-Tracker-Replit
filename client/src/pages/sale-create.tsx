import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Plus, Trash2, Loader2, Search, User, Package,
  FileDown, CheckCircle, ChevronDown, ChevronUp,
} from "lucide-react";
import type { Customer, Equipment, SalesInvoice } from "@shared/schema";
import { EQUIPMENT_TYPE_LABELS, TYPES_WITHOUT_SERIAL } from "@shared/schema";

const today = () => new Date().toISOString().slice(0, 10);

type LineItem = {
  equipmentId: number;
  description: string;
  serialNumber: string;
  sku: string;
  unitPrice: string;
  equipment: Equipment;
};

const VAT_OPTIONS = [
  { value: "standard_19", label: "19% MwSt. (standard)", rate: 19, note: "" },
  { value: "differenzbesteuerung", label: "0% – Differenzbesteuerung §25a UStG", rate: 0, note: "Differenzbesteuerung nach §25a UStG" },
  { value: "kleinunternehmer", label: "0% – Kleinunternehmer §19 UStG", rate: 0, note: "Kleinunternehmer nach §19 UStG" },
  { value: "eu_delivery", label: "0% – Innergemeinschaftliche Lieferung §4 Nr. 1b", rate: 0, note: "Innergemeinschaftliche Lieferung nach §4 Nr. 1b UStG" },
  { value: "custom", label: "Custom VAT rate", rate: 0, note: "" },
];

const PAY_OPTIONS = [
  { value: "bank_transfer", label: "Bank Transfer (Überweisung)" },
  { value: "cash", label: "Cash (Bar)" },
  { value: "paypal", label: "PayPal" },
  { value: "credit_card", label: "Credit Card (Kreditkarte)" },
];

export default function SaleCreatePage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: customers = [] } = useQuery<Customer[]>({ queryKey: ["/api/customers"] });
  const { data: allEquipment = [] } = useQuery<Equipment[]>({ queryKey: ["/api/equipment"] });
  const { data: nextNum } = useQuery<{ invoiceNumber: string }>({ queryKey: ["/api/sales/next-number"] });

  // ── Customer ──────────────────────────────────────────────────
  const [customerId, setCustomerId] = useState<string>("");
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCust, setNewCust] = useState({ name: "", companyName: "", address: "", email: "", taxId: "" });

  const createCustomerMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/customers", newCust).then((r) => r.json()),
    onSuccess: (c: Customer) => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setCustomerId(String(c.id));
      setShowNewCustomer(false);
      setNewCust({ name: "", companyName: "", address: "", email: "", taxId: "" });
      toast({ title: "Customer created" });
    },
    onError: (e: any) => toast({ title: "Failed to create customer", description: e.message, variant: "destructive" }),
  });

  // ── Equipment picker ──────────────────────────────────────────
  const [items, setItems] = useState<LineItem[]>([]);
  const [equipSearch, setEquipSearch] = useState("");
  const [showEquipPicker, setShowEquipPicker] = useState(false);

  const selectedIds = new Set(items.map((i) => i.equipmentId));
  const availableEquipment = useMemo(() => {
    const active = allEquipment.filter((e) => e.status === "active" && !selectedIds.has(e.id));
    if (!equipSearch) return active;
    const s = equipSearch.toLowerCase();
    return active.filter((e) =>
      e.brand.toLowerCase().includes(s) ||
      e.model.toLowerCase().includes(s) ||
      (e.serialNumber || "").toLowerCase().includes(s) ||
      (e.sku || "").toLowerCase().includes(s)
    );
  }, [allEquipment, selectedIds, equipSearch]);

  const addItem = (equip: Equipment) => {
    const size = (equip.typeSpecificFields as any)?.size;
    const desc = [equip.brand, equip.model, size ? `${size}${equip.type === "kite" || equip.type === "wing" ? "m²" : "cm"}` : ""].filter(Boolean).join(" ");
    const isNoSerial = TYPES_WITHOUT_SERIAL.includes(equip.type as any) ||
      equip.serialNumber?.startsWith("AUTO-") || equip.serialNumber?.startsWith("IMPORT-");
    setItems((prev) => [
      ...prev,
      {
        equipmentId: equip.id,
        description: desc,
        serialNumber: isNoSerial ? "" : (equip.serialNumber || ""),
        sku: equip.sku || "",
        unitPrice: equip.salePrice || equip.currentValue || "",
        equipment: equip,
      },
    ]);
    setEquipSearch("");
    setShowEquipPicker(false);
  };

  const removeItem = (equipmentId: number) => setItems((prev) => prev.filter((i) => i.equipmentId !== equipmentId));
  const updateItem = (equipmentId: number, field: keyof LineItem, value: string) =>
    setItems((prev) => prev.map((i) => i.equipmentId === equipmentId ? { ...i, [field]: value } : i));

  // ── Invoice settings ──────────────────────────────────────────
  const [vatType, setVatType] = useState("standard_19");
  const [customVatRate, setCustomVatRate] = useState("0");
  const [customVatNote, setCustomVatNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [paymentTerms, setPaymentTerms] = useState("14 Tage ohne Abzug");
  const [invoiceDate, setInvoiceDate] = useState(today());
  const [deliveryDate, setDeliveryDate] = useState("");
  const [notes, setNotes] = useState("");

  const vatOption = VAT_OPTIONS.find((v) => v.value === vatType)!;
  const vatRate = vatType === "custom" ? parseFloat(customVatRate) || 0 : vatOption.rate;
  const vatNote = vatType === "custom" ? customVatNote : vatOption.note;

  // ── Totals ────────────────────────────────────────────────────
  const totalNet = items.reduce((sum, i) => sum + (parseFloat(i.unitPrice) || 0), 0);
  const totalVat = totalNet * (vatRate / 100);
  const totalGross = totalNet + totalVat;

  // ── Result state ──────────────────────────────────────────────
  const [createdSale, setCreatedSale] = useState<SalesInvoice | null>(null);

  const createMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/sales", {
        customerId: parseInt(customerId),
        invoiceDate,
        deliveryDate: deliveryDate || undefined,
        paymentMethod,
        paymentTerms,
        vatType,
        vatRate,
        vatNote,
        notes: notes || undefined,
        totalNet: totalNet.toFixed(2),
        totalVat: totalVat.toFixed(2),
        totalGross: totalGross.toFixed(2),
        items: items.map((i) => ({
          equipmentId: i.equipmentId,
          description: i.description,
          serialNumber: i.serialNumber,
          sku: i.sku,
          unitPrice: parseFloat(i.unitPrice) || 0,
        })),
      }).then((r) => r.json()),
    onSuccess: (sale: SalesInvoice) => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sales/next-number"] });
      setCreatedSale(sale);
      toast({ title: `Invoice ${sale.invoiceNumber} created` });
    },
    onError: (e: any) => toast({ title: "Failed to create invoice", description: e.message, variant: "destructive" }),
  });

  const confirmMutation = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/sales/${id}/confirm`).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      toast({ title: "Sale confirmed — items marked as Sold" });
      navigate("/sales");
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const canCreate = !!customerId && items.length > 0 && items.every((i) => parseFloat(i.unitPrice) > 0);

  // ── Success screen ────────────────────────────────────────────
  if (createdSale) {
    return (
      <div className="p-4 md:p-6 max-w-lg mx-auto space-y-5">
        <div className="text-center space-y-2 py-6">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
          <h2 className="text-xl font-bold">Invoice Created</h2>
          <p className="font-mono text-primary text-lg font-bold" data-testid="text-created-invoice-number">{createdSale.invoiceNumber}</p>
          <p className="text-muted-foreground text-sm">Total: €{parseFloat(createdSale.totalGross).toFixed(2)} · Status: Draft</p>
        </div>
        <div className="space-y-3">
          <a
            href={`/api/sales/${createdSale.id}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-md border border-primary text-primary font-medium hover:bg-primary/5 transition-colors"
            data-testid="button-download-pdf"
          >
            <FileDown className="h-4 w-4" /> Download Invoice PDF
          </a>
          <Button
            className="w-full"
            onClick={() => confirmMutation.mutate(createdSale.id)}
            disabled={confirmMutation.isPending}
            data-testid="button-confirm-sale"
          >
            {confirmMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <CheckCircle className="mr-2 h-4 w-4" /> Confirm Sale (mark equipment as Sold)
          </Button>
          <Button variant="outline" className="w-full" onClick={() => navigate("/sales")} data-testid="button-back-to-sales">
            Back to Sales
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/sales">
          <Button variant="ghost" size="icon" data-testid="button-back-sales"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold">Create Sales Invoice</h1>
          {nextNum && <p className="text-xs text-muted-foreground">Next number: {nextNum.invoiceNumber}</p>}
        </div>
      </div>

      {/* ── Customer ── */}
      <Card>
        <CardHeader className="pb-2">
          <h2 className="font-semibold flex items-center gap-2"><User className="h-4 w-4" /> Customer</h2>
        </CardHeader>
        <CardContent className="space-y-3">
          {customers.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs">Select existing customer</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger data-testid="select-customer">
                  <SelectValue placeholder="Choose a customer..." />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}{c.companyName ? ` (${c.companyName})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowNewCustomer(!showNewCustomer)}
            data-testid="button-toggle-new-customer"
            className="gap-2"
          >
            {showNewCustomer ? <ChevronUp className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            {showNewCustomer ? "Cancel" : "New Customer"}
          </Button>

          {showNewCustomer && (
            <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
              <p className="text-sm font-medium">New Customer</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { key: "name", label: "Full Name *", placeholder: "Jane Doe" },
                  { key: "companyName", label: "Company Name", placeholder: "Optional" },
                  { key: "email", label: "Email *", placeholder: "jane@example.com" },
                  { key: "taxId", label: "Tax ID (for B2B)", placeholder: "Optional" },
                ].map(({ key, label, placeholder }) => (
                  <div key={key} className="space-y-1.5">
                    <Label className="text-xs">{label}</Label>
                    <Input
                      value={newCust[key as keyof typeof newCust]}
                      onChange={(e) => setNewCust((p) => ({ ...p, [key]: e.target.value }))}
                      placeholder={placeholder}
                      data-testid={`input-new-customer-${key}`}
                    />
                  </div>
                ))}
                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-xs">Address *</Label>
                  <Textarea
                    value={newCust.address}
                    onChange={(e) => setNewCust((p) => ({ ...p, address: e.target.value }))}
                    placeholder={"Musterstraße 1\n12345 Berlin\nGermany"}
                    rows={3}
                    data-testid="input-new-customer-address"
                  />
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => createCustomerMutation.mutate()}
                disabled={createCustomerMutation.isPending || !newCust.name || !newCust.address || !newCust.email}
                data-testid="button-create-customer"
              >
                {createCustomerMutation.isPending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                Create Customer
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Equipment Items ── */}
      <Card>
        <CardHeader className="pb-2">
          <h2 className="font-semibold flex items-center gap-2"><Package className="h-4 w-4" /> Equipment Items</h2>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.length > 0 && (
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={item.equipmentId} className="border rounded-lg p-3 space-y-2" data-testid={`item-row-${idx}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{item.description}</p>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        <Badge variant="outline" className="text-[10px]">{EQUIPMENT_TYPE_LABELS[item.equipment.type] || item.equipment.type}</Badge>
                        {item.sku && <span className="text-[10px] text-muted-foreground font-mono">{item.sku}</span>}
                        {item.serialNumber && <span className="text-[10px] text-muted-foreground font-mono">{item.serialNumber}</span>}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removeItem(item.equipmentId)} data-testid={`button-remove-item-${idx}`}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Description</Label>
                      <Input value={item.description} onChange={(e) => updateItem(item.equipmentId, "description", e.target.value)} className="h-7 text-xs" data-testid={`input-item-desc-${idx}`} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Sale Price (€) *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(item.equipmentId, "unitPrice", e.target.value)}
                        className={`h-7 text-xs ${!parseFloat(item.unitPrice) ? "border-orange-400" : ""}`}
                        placeholder="0.00"
                        data-testid={`input-item-price-${idx}`}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Equipment picker */}
          <div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEquipPicker(!showEquipPicker)}
              data-testid="button-add-equipment"
              className="gap-2"
            >
              <Plus className="h-3.5 w-3.5" /> Add Equipment
            </Button>

            {showEquipPicker && (
              <div className="mt-2 border rounded-lg p-3 space-y-2 max-h-72 overflow-y-auto">
                <div className="relative">
                  <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={equipSearch}
                    onChange={(e) => setEquipSearch(e.target.value)}
                    placeholder="Search brand, model, serial..."
                    className="h-8 pl-7 text-xs"
                    data-testid="input-equipment-search"
                    autoFocus
                  />
                </div>
                {availableEquipment.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No available equipment found</p>
                ) : (
                  <div className="space-y-1">
                    {availableEquipment.slice(0, 30).map((equip) => {
                      const size = (equip.typeSpecificFields as any)?.size;
                      return (
                        <button
                          key={equip.id}
                          className="w-full text-left px-2 py-2 rounded hover:bg-muted transition-colors"
                          onClick={() => addItem(equip)}
                          data-testid={`button-select-equip-${equip.id}`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-xs font-medium truncate">{equip.brand} {equip.model}{size ? ` ${size}${equip.type === "kite" || equip.type === "wing" ? "m²" : "cm"}` : ""}</p>
                              <p className="text-[10px] text-muted-foreground">{EQUIPMENT_TYPE_LABELS[equip.type]} {equip.serialNumber && !equip.serialNumber.startsWith("AUTO-") && !equip.serialNumber.startsWith("IMPORT-") ? `· S/N: ${equip.serialNumber}` : ""}</p>
                            </div>
                            {equip.currentValue && <span className="text-xs text-muted-foreground shrink-0">€{equip.currentValue}</span>}
                          </div>
                        </button>
                      );
                    })}
                    {availableEquipment.length > 30 && <p className="text-xs text-center text-muted-foreground">Showing 30 of {availableEquipment.length} — refine search</p>}
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Invoice Settings ── */}
      <Card>
        <CardHeader className="pb-2"><h2 className="font-semibold">Invoice Settings</h2></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Invoice Date *</Label>
              <Input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} data-testid="input-invoice-date" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Delivery Date</Label>
              <Input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} data-testid="input-delivery-date" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Payment Terms</Label>
              <Input value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} data-testid="input-payment-terms" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger data-testid="select-payment-method"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAY_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">VAT Treatment</Label>
            <Select value={vatType} onValueChange={setVatType}>
              <SelectTrigger data-testid="select-vat-type"><SelectValue /></SelectTrigger>
              <SelectContent>
                {VAT_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {vatType === "custom" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Custom VAT Rate (%)</Label>
                <Input type="number" step="0.01" value={customVatRate} onChange={(e) => setCustomVatRate(e.target.value)} placeholder="7.00" data-testid="input-custom-vat-rate" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Legal Note on Invoice</Label>
                <Input value={customVatNote} onChange={(e) => setCustomVatNote(e.target.value)} placeholder="e.g. Sonderregelung..." data-testid="input-custom-vat-note" />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs">Notes / Comments</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional remarks shown on invoice..." rows={2} data-testid="input-invoice-notes" />
          </div>
        </CardContent>
      </Card>

      {/* ── Totals ── */}
      {items.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Net total</span>
                <span className="font-medium" data-testid="text-total-net">€{totalNet.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">VAT ({vatRate}%){vatNote ? ` – ${vatNote}` : ""}</span>
                <span className="font-medium" data-testid="text-total-vat">€{totalVat.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-bold">Total (gross)</span>
                <span className="font-bold text-lg" data-testid="text-total-gross">€{totalGross.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Create Button ── */}
      <Button
        className="w-full"
        onClick={() => createMutation.mutate()}
        disabled={!canCreate || createMutation.isPending}
        data-testid="button-create-invoice"
      >
        {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Create Invoice {nextNum ? `(${nextNum.invoiceNumber})` : ""}
      </Button>

      {!canCreate && (
        <p className="text-xs text-center text-muted-foreground" data-testid="text-create-hint">
          {!customerId ? "Select a customer" : items.length === 0 ? "Add at least one equipment item" : "Set a price for all items"}
        </p>
      )}
    </div>
  );
}
