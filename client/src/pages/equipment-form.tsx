import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2 } from "lucide-react";
import type { Station } from "@shared/schema";
import { EQUIPMENT_TYPE_LABELS, EQUIPMENT_TYPE_OPTIONS, TYPE_SPECIFIC_FIELDS } from "@shared/schema";
import { TYPES_WITHOUT_SERIAL } from "./equipment-list";
import { Link } from "wouter";

export default function EquipmentFormPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: stationsList } = useQuery<Station[]>({ queryKey: ["/api/stations"] });

  const prefillSerial = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("serial") || ""
    : "";

  const [serialNumber, setSerialNumber] = useState(prefillSerial);
  const [sku, setSku] = useState("");
  const [type, setType] = useState("kite");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [yearOfPurchase, setYearOfPurchase] = useState(new Date().getFullYear().toString());
  const [currentStationId, setCurrentStationId] = useState("");
  const [status, setStatus] = useState("active");
  const [conditionRating, setConditionRating] = useState("5");
  const [notes, setNotes] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [currentValue, setCurrentValue] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [typeSpecific, setTypeSpecific] = useState<Record<string, any>>({});

  const serialOptional = TYPES_WITHOUT_SERIAL.includes(type);

  const mutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/equipment", {
        serialNumber: serialOptional && !serialNumber
          ? `AUTO-${type.toUpperCase()}-${Date.now()}`
          : serialNumber,
        sku: sku || null,
        type,
        brand,
        model,
        purchaseDate: purchaseDate ? new Date(purchaseDate).toISOString() : null,
        yearOfPurchase: purchaseDate
          ? new Date(purchaseDate).getFullYear()
          : yearOfPurchase ? parseInt(yearOfPurchase) : null,
        currentStationId: currentStationId ? parseInt(currentStationId) : null,
        status,
        conditionRating: parseInt(conditionRating),
        notes: notes || null,
        purchasePrice: purchasePrice || null,
        currentValue: currentValue || null,
        salePrice: salePrice || null,
        typeSpecificFields: typeSpecific,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      toast({ title: "Equipment added" });
      setLocation("/equipment");
    },
    onError: (err: Error) => {
      toast({
        title: "Failed to add equipment",
        description: err.message.includes("Serial") || err.message.includes("duplicate")
          ? "Serial number already exists"
          : err.message,
        variant: "destructive",
      });
    },
  });

  const typeFields = TYPE_SPECIFIC_FIELDS[type] || [];

  const handleTypeSpecificChange = (key: string, value: string) => {
    setTypeSpecific((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/equipment">
          <Button variant="ghost" size="icon" data-testid="button-back-form">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-xl md:text-2xl font-bold">Add Equipment</h1>
      </div>

      <Card>
        <CardContent className="p-4 md:p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {!serialOptional && (
              <div className="space-y-2">
                <Label>Serial Number *</Label>
                <Input value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} placeholder="DT-K-2024-001" data-testid="input-serial" />
                <p className="text-xs text-muted-foreground">Unique item identifier (barcode/label)</p>
              </div>
            )}
            <div className="space-y-2">
              <Label>SKU</Label>
              <Input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="DT-REBEL-12-2024" data-testid="input-sku" />
              <p className="text-xs text-muted-foreground">Product code (same for all items of this model)</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Equipment Type *</Label>
            <Select value={type} onValueChange={(v) => { setType(v); setTypeSpecific({}); }}>
              <SelectTrigger data-testid="select-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EQUIPMENT_TYPE_OPTIONS.map((key) => (
                  <SelectItem key={key} value={key}>{EQUIPMENT_TYPE_LABELS[key]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Brand *</Label>
              <Input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Duotone" data-testid="input-brand" />
            </div>
            <div className="space-y-2">
              <Label>Model *</Label>
              <Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="Rebel SLS" data-testid="input-model" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Date of Purchase</Label>
              <Input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} data-testid="input-purchase-date" />
            </div>
            <div className="space-y-2">
              <Label>Station</Label>
              <Select value={currentStationId} onValueChange={setCurrentStationId}>
                <SelectTrigger data-testid="select-station">
                  <SelectValue placeholder="Select station" />
                </SelectTrigger>
                <SelectContent>
                  {stationsList?.map((s) => (
                    <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Condition</Label>
              <Select value={conditionRating} onValueChange={setConditionRating}>
                <SelectTrigger data-testid="select-condition">
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
          </div>

          {typeFields.length > 0 && (
            <>
              <div className="border-t pt-4">
                <h3 className="font-semibold text-sm mb-3 uppercase tracking-wider text-muted-foreground">
                  {EQUIPMENT_TYPE_LABELS[type]} Specifications
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {typeFields.map((field) => (
                    <div key={field.key} className="space-y-2">
                      <Label>{field.label}</Label>
                      {field.type === "select" ? (
                        <Select
                          value={typeSpecific[field.key] || ""}
                          onValueChange={(v) => handleTypeSpecificChange(field.key, v)}
                        >
                          <SelectTrigger data-testid={`select-specific-${field.key}`}>
                            <SelectValue placeholder={`Select ${field.label}`} />
                          </SelectTrigger>
                          <SelectContent>
                            {field.options?.map((opt) => (
                              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          type={field.type}
                          value={typeSpecific[field.key] || ""}
                          onChange={(e) => handleTypeSpecificChange(field.key, e.target.value)}
                          data-testid={`input-specific-${field.key}`}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="border-t pt-4">
            <h3 className="font-semibold text-sm mb-3 uppercase tracking-wider text-muted-foreground">Financial Data</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Purchase Price (€)</Label>
                <Input type="number" step="0.01" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} placeholder="0.00" data-testid="input-purchase-price" />
              </div>
              <div className="space-y-2">
                <Label>Current Value (€)</Label>
                <Input type="number" step="0.01" value={currentValue} onChange={(e) => setCurrentValue(e.target.value)} placeholder="0.00" data-testid="input-current-value" />
              </div>
              <div className="space-y-2">
                <Label>Sale Price (€)</Label>
                <Input type="number" step="0.01" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} placeholder="0.00" data-testid="input-sale-price" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional notes..." data-testid="input-notes" />
          </div>

          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || (!serialNumber && !serialOptional) || !brand || !model}
            className="w-full"
            data-testid="button-save-equipment"
          >
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Equipment
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
