import { useState, useRef, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Upload, Trash2, Loader2, ChevronDown, ChevronUp,
  CheckCircle, XCircle, List, FileText, AlertTriangle, Calendar, Pencil,
  TrendingUp, TrendingDown, Minus, Plus, ArrowRight,
} from "lucide-react";
import type { PriceList, PriceListItem } from "@shared/schema";

const KNOWN_SUPPLIERS = ["Core", "Duotone", "North", "Eleveight", "Cabrinha", "Ozone", "F-One"];

type ParsedItem = { sku: string; productName: string; retailPrice: string; dealerPrice: string | null; productType: string | null };

const TYPE_LABELS: Record<string, string> = {
  kite: "Kite", board: "Board", foilboard: "Foilboard", foil: "Foil",
  wing: "Wing", bar_lines: "Bar",
};
const TYPE_COLORS: Record<string, string> = {
  kite: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  board: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  foilboard: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
  foil: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  wing: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  bar_lines: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
};
function TypeBadge({ type }: { type: string | null | undefined }) {
  if (!type) return <span className="text-muted-foreground text-[10px]">—</span>;
  return (
    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${TYPE_COLORS[type] ?? "bg-muted text-muted-foreground"}`}>
      {TYPE_LABELS[type] ?? type}
    </span>
  );
}

export default function PriceListsPage() {
  const { toast } = useToast();

  const { data: priceLists = [], isLoading } = useQuery<PriceList[]>({
    queryKey: ["/api/price-lists"],
  });

  // ── Upload flow ──────────────────────────────────────────────────
  const [supplier, setSupplier] = useState("");
  const [customSupplier, setCustomSupplier] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [listName, setListName] = useState("");
  const [validFrom, setValidFrom] = useState("");
  const [validTo, setValidTo] = useState("");
  const [parsedItems, setParsedItems] = useState<ParsedItem[] | null>(null);
  const [removedRows, setRemovedRows] = useState<Set<number>>(new Set());
  const [expandPreview, setExpandPreview] = useState(false);
  const [oldItems, setOldItems] = useState<PriceListItem[]>([]);
  const [oldPriceListName, setOldPriceListName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const effectiveSupplier = supplier === "__custom__" ? customSupplier : supplier;

  const parseMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("No file selected");
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/price-lists/parse", {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      if (!res.ok) throw new Error((await res.json()).message);
      return res.json() as Promise<{ items: ParsedItem[]; rawLineCount: number; detectedName: string | null; detectedValidFrom: string | null }>;
    },
    onSuccess: async (data) => {
      setParsedItems(data.items);
      setRemovedRows(new Set());
      setExpandPreview(true);
      if (data.detectedName) setListName(data.detectedName);
      if (data.detectedValidFrom && !validFrom) setValidFrom(data.detectedValidFrom);

      setOldItems([]);
      setOldPriceListName(null);
      const activePl = priceLists.find((pl) => pl.isActive && pl.supplier.toLowerCase() === effectiveSupplier.toLowerCase());
      if (activePl) {
        try {
          const res = await fetch(`/api/price-lists/${activePl.id}/items`, { credentials: "include" });
          if (res.ok) {
            setOldItems(await res.json());
            setOldPriceListName(activePl.name ? `${activePl.supplier} — ${activePl.name}` : activePl.supplier);
          }
        } catch { /* ignore — oldItems already cleared above */ }
      }

      if (data.items.length === 0) {
        toast({ title: "No items extracted", description: `Parser processed ${data.rawLineCount} lines but found no matching SKU + price rows. The PDF format may not be supported.`, variant: "destructive" });
      } else {
        const autoMsg = data.detectedName ? ` Detected: ${data.detectedName}` : "";
        toast({ title: `Extracted ${data.items.length} items`, description: `From ${data.rawLineCount} text lines in the PDF.${autoMsg} Review below, then confirm to save.` });
      }
    },
    onError: (e: any) => toast({ title: "Parse failed", description: e.message, variant: "destructive" }),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const confirmed = parsedItems!.filter((_, i) => !removedRows.has(i));
      const res = await apiRequest("POST", "/api/price-lists", {
        supplier: effectiveSupplier,
        items: confirmed,
        validFrom: validFrom || null,
        validTo: validTo || null,
        name: listName || null,
      });
      if (!res.ok) throw new Error((await res.json()).message);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/price-lists"] });
      toast({ title: "Price list saved!", description: `Active price list for ${effectiveSupplier} updated.` });
      setParsedItems(null);
      setFile(null);
      setSupplier("");
      setCustomSupplier("");
      setListName("");
      setValidFrom("");
      setValidTo("");
      setRemovedRows(new Set());
      setOldItems([]);
      setOldPriceListName(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    onError: (e: any) => toast({ title: "Save failed", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/price-lists/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/price-lists"] });
      toast({ title: "Price list deleted" });
    },
    onError: (e: any) => toast({ title: "Delete failed", description: e.message, variant: "destructive" }),
  });

  const toggleRow = (i: number) => {
    setRemovedRows((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const [editingDatesId, setEditingDatesId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editValidFrom, setEditValidFrom] = useState("");
  const [editValidTo, setEditValidTo] = useState("");

  const updateDatesMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PATCH", `/api/price-lists/${id}`, {
        name: editName || null,
        validFrom: editValidFrom || null,
        validTo: editValidTo || null,
      });
      if (!res.ok) throw new Error((await res.json()).message);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/price-lists"] });
      toast({ title: "Price list updated" });
      setEditingDatesId(null);
    },
    onError: (e: any) => toast({ title: "Update failed", description: e.message, variant: "destructive" }),
  });

  // ── Per-list item viewer ─────────────────────────────────────────
  const [viewingId, setViewingId] = useState<number | null>(null);
  const { data: viewItems = [], isLoading: viewLoading } = useQuery<PriceListItem[]>({
    queryKey: ["/api/price-lists", viewingId, "items"],
    queryFn: () => fetch(`/api/price-lists/${viewingId}/items`, { credentials: "include" }).then((r) => r.json()),
    enabled: viewingId !== null,
  });

  // Group lists by supplier for status overview
  const supplierMap = new Map<string, PriceList[]>();
  for (const pl of priceLists) {
    if (!supplierMap.has(pl.supplier)) supplierMap.set(pl.supplier, []);
    supplierMap.get(pl.supplier)!.push(pl);
  }
  const allKnown = KNOWN_SUPPLIERS;
  const allPresent = Array.from(supplierMap.keys());
  const allSuppliers = Array.from(new Set([...allKnown, ...allPresent]));

  const confirmedItems = parsedItems ? parsedItems.filter((_, i) => !removedRows.has(i)) : [];

  const oldSkuMap = useMemo(() => {
    const map = new Map<string, { retailPrice: string; dealerPrice: string | null; productName: string }>();
    for (const item of oldItems) {
      map.set(item.sku, { retailPrice: item.retailPrice, dealerPrice: item.dealerPrice, productName: item.productName });
    }
    return map;
  }, [oldItems]);

  const comparison = useMemo(() => {
    if (!parsedItems || oldItems.length === 0) return null;
    const newSkus = new Set(parsedItems.map((i) => i.sku));
    let priceUp = 0, priceDown = 0, unchanged = 0, newItems = 0;
    for (const item of parsedItems) {
      const old = oldSkuMap.get(item.sku);
      if (!old) { newItems++; continue; }
      const oldP = parseFloat(old.retailPrice);
      const newP = parseFloat(item.retailPrice);
      if (newP > oldP) priceUp++;
      else if (newP < oldP) priceDown++;
      else unchanged++;
    }
    const removedItems = oldItems.filter((i) => !newSkus.has(i.sku));
    return { priceUp, priceDown, unchanged, newItems, removedItems };
  }, [parsedItems, oldItems, oldSkuMap]);

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Price Lists</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Upload manufacturer retail price lists (UVP/MSRP). Only one price list per supplier is active at a time.
        </p>
      </div>

      {/* ── Supplier Status Overview ── */}
      <Card>
        <CardHeader className="pb-2">
          <h2 className="font-semibold flex items-center gap-2"><List className="h-4 w-4" /> Supplier Status</h2>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm"><Loader2 className="h-3 w-3 animate-spin" /> Loading…</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {allSuppliers.map((s) => {
                const lists = supplierMap.get(s) || [];
                const active = lists.find((l) => l.isActive);
                return (
                  <div key={s} className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2">
                    <div className="flex items-center gap-2">
                      {active ? (
                        <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                      <span className="font-medium text-sm">{s}</span>
                    </div>
                    {active ? (
                      <div className="text-right">
                        <span className="text-xs text-muted-foreground block">
                          {active.itemCount} items · {active.uploadedAt ? new Date(active.uploadedAt).toLocaleDateString("de-DE") : ""}
                        </span>
                        {(active.validFrom || active.validTo) && (
                          <span className="text-[10px] text-muted-foreground block">
                            {active.validFrom ? new Date(active.validFrom).toLocaleDateString("de-DE") : "—"}
                            {" → "}
                            {active.validTo ? new Date(active.validTo).toLocaleDateString("de-DE") : "—"}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">No price list</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Upload New Price List ── */}
      <Card>
        <CardHeader className="pb-2">
          <h2 className="font-semibold flex items-center gap-2"><Upload className="h-4 w-4" /> Upload New Price List</h2>
        </CardHeader>
        <div className="mx-4 mb-0 rounded-md border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/40 px-4 py-3 text-sm text-blue-800 dark:text-blue-300 leading-relaxed">
          ℹ️ <strong>Important:</strong> Only items with a UVP of €200 or more will be captured. Please review all imported items carefully and uncheck any that are not needed. If you encounter problems with the upload, please contact <a href="mailto:york@kiteworldwide.com" className="underline underline-offset-2 hover:opacity-80">york@kiteworldwide.com</a> with a description of the error.
        </div>
        <CardContent className="space-y-4 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Supplier *</Label>
              <select
                value={supplier}
                onChange={(e) => { setSupplier(e.target.value); setParsedItems(null); }}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                data-testid="select-supplier"
              >
                <option value="">Select supplier…</option>
                {KNOWN_SUPPLIERS.map((s) => <option key={s} value={s}>{s}</option>)}
                <option value="__custom__">Other (type below)</option>
              </select>
              {supplier === "__custom__" && (
                <Input
                  value={customSupplier}
                  onChange={(e) => setCustomSupplier(e.target.value)}
                  placeholder="Supplier name"
                  className="mt-1"
                  data-testid="input-custom-supplier"
                />
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">PDF Price List *</Label>
              <Input
                type="file"
                accept=".pdf,application/pdf"
                ref={fileInputRef}
                onChange={(e) => { setFile(e.target.files?.[0] || null); setParsedItems(null); setListName(""); }}
                data-testid="input-price-list-file"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => parseMutation.mutate()}
              disabled={!effectiveSupplier || !file || parseMutation.isPending}
              data-testid="button-parse-price-list"
            >
              {parseMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Parse PDF
            </Button>
            {parsedItems && (
              <span className="text-sm text-muted-foreground">
                {confirmedItems.length} of {parsedItems.length} rows selected
              </span>
            )}
          </div>

          {/* Preview */}
          {parsedItems !== null && (
            <div className="space-y-3 border rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">Preview — {effectiveSupplier}</span>
                  {parsedItems.length === 0 && (
                    <Badge variant="destructive" className="text-xs gap-1">
                      <AlertTriangle className="h-3 w-3" /> No items extracted
                    </Badge>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={() => setExpandPreview((v) => !v)} data-testid="button-toggle-preview">
                  {expandPreview ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>

              {comparison && (
                <div className="rounded-md border bg-muted/30 p-2.5 space-y-1.5" data-testid="comparison-summary">
                  <p className="text-xs font-medium text-muted-foreground">
                    Compared to active list: {oldPriceListName}
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                    {comparison.priceUp > 0 && (
                      <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                        <TrendingUp className="h-3 w-3" /> {comparison.priceUp} price increase{comparison.priceUp !== 1 ? "s" : ""}
                      </span>
                    )}
                    {comparison.priceDown > 0 && (
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <TrendingDown className="h-3 w-3" /> {comparison.priceDown} price decrease{comparison.priceDown !== 1 ? "s" : ""}
                      </span>
                    )}
                    {comparison.unchanged > 0 && (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Minus className="h-3 w-3" /> {comparison.unchanged} unchanged
                      </span>
                    )}
                    {comparison.newItems > 0 && (
                      <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                        <Plus className="h-3 w-3" /> {comparison.newItems} new
                      </span>
                    )}
                    {comparison.removedItems.length > 0 && (
                      <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                        <AlertTriangle className="h-3 w-3" /> {comparison.removedItems.length} removed
                      </span>
                    )}
                  </div>
                </div>
              )}

              {expandPreview && parsedItems.length > 0 && (
                <div className="overflow-x-auto max-h-[60vh] overflow-y-auto rounded border">
                  <table className="w-full text-xs">
                    <thead className="bg-muted sticky top-0">
                      <tr>
                        <th className="px-2 py-1.5 text-left font-medium w-8">✓</th>
                        <th className="px-2 py-1.5 text-left font-medium">Type</th>
                        <th className="px-2 py-1.5 text-left font-medium">SKU / UPC</th>
                        <th className="px-2 py-1.5 text-left font-medium">Product Name</th>
                        <th className="px-2 py-1.5 text-right font-medium">Dealer (net)</th>
                        <th className="px-2 py-1.5 text-right font-medium">MSRP (gross)</th>
                        {oldItems.length > 0 && <th className="px-2 py-1.5 text-right font-medium">Change</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {parsedItems.map((item, i) => {
                        const old = oldSkuMap.get(item.sku);
                        const isNew = !old;
                        const oldRetail = old ? parseFloat(old.retailPrice) : 0;
                        const newRetail = parseFloat(item.retailPrice);
                        const priceDiff = old ? newRetail - oldRetail : 0;
                        const pctChange = old && oldRetail > 0 ? ((priceDiff / oldRetail) * 100) : 0;
                        return (
                          <tr
                            key={i}
                            className={`border-t cursor-pointer hover:bg-muted/50 ${removedRows.has(i) ? "opacity-40 line-through" : ""} ${isNew && oldItems.length > 0 ? "bg-blue-50/50 dark:bg-blue-950/20" : ""}`}
                            onClick={() => toggleRow(i)}
                            data-testid={`row-preview-${i}`}
                          >
                            <td className="px-2 py-1">
                              <input type="checkbox" checked={!removedRows.has(i)} onChange={() => toggleRow(i)} onClick={(e) => e.stopPropagation()} className="h-3 w-3" />
                            </td>
                            <td className="px-2 py-1"><TypeBadge type={item.productType} /></td>
                            <td className="px-2 py-1 font-mono text-[10px]">{item.sku}</td>
                            <td className="px-2 py-1">{item.productName}</td>
                            <td className="px-2 py-1 text-right text-muted-foreground">
                              {item.dealerPrice ? `€${parseFloat(item.dealerPrice).toLocaleString("de-DE", { minimumFractionDigits: 2 })}` : "—"}
                            </td>
                            <td className="px-2 py-1 text-right font-medium">€{newRetail.toLocaleString("de-DE", { minimumFractionDigits: 2 })}</td>
                            {oldItems.length > 0 && (
                              <td className="px-2 py-1 text-right whitespace-nowrap">
                                {isNew ? (
                                  <span className="text-blue-600 dark:text-blue-400 font-medium text-[10px]">NEW</span>
                                ) : priceDiff === 0 ? (
                                  <span className="text-muted-foreground text-[10px]">—</span>
                                ) : (
                                  <span className={`text-[10px] font-medium ${priceDiff > 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                                    {priceDiff > 0 ? "+" : ""}{priceDiff.toLocaleString("de-DE", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} € ({pctChange > 0 ? "+" : ""}{pctChange.toFixed(1)}%)
                                  </span>
                                )}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                      {comparison && comparison.removedItems.length > 0 && (
                        <>
                          <tr className="border-t-2 border-amber-300 dark:border-amber-700">
                            <td colSpan={oldItems.length > 0 ? 7 : 6} className="px-2 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30">
                              <span className="flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                {comparison.removedItems.length} item{comparison.removedItems.length !== 1 ? "s" : ""} from old list not in new list:
                              </span>
                            </td>
                          </tr>
                          {comparison.removedItems.map((item) => (
                            <tr key={`removed-${item.id}`} className="border-t opacity-50 bg-amber-50/30 dark:bg-amber-950/10">
                              <td className="px-2 py-1" />
                              <td className="px-2 py-1"><TypeBadge type={item.productType} /></td>
                              <td className="px-2 py-1 font-mono text-[10px]">{item.sku}</td>
                              <td className="px-2 py-1 line-through">{item.productName}</td>
                              <td className="px-2 py-1 text-right text-muted-foreground line-through">
                                {item.dealerPrice ? `€${parseFloat(item.dealerPrice).toLocaleString("de-DE", { minimumFractionDigits: 2 })}` : "—"}
                              </td>
                              <td className="px-2 py-1 text-right line-through">€{parseFloat(item.retailPrice).toLocaleString("de-DE", { minimumFractionDigits: 2 })}</td>
                              {oldItems.length > 0 && (
                                <td className="px-2 py-1 text-right">
                                  <span className="text-amber-600 dark:text-amber-400 font-medium text-[10px]">REMOVED</span>
                                </td>
                              )}
                            </tr>
                          ))}
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {parsedItems.length > 0 && (
                <div className="flex items-center gap-3 pt-1">
                  <Button
                    onClick={() => saveMutation.mutate()}
                    disabled={confirmedItems.length === 0 || saveMutation.isPending}
                    data-testid="button-save-price-list"
                  >
                    {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save {confirmedItems.length} Items for {effectiveSupplier}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    This will deactivate any existing price list for {effectiveSupplier}.
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── All Uploaded Price Lists ── */}
      <Card>
        <CardHeader className="pb-2">
          <h2 className="font-semibold">All Uploaded Price Lists</h2>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm"><Loader2 className="h-3 w-3 animate-spin" /> Loading…</div>
          ) : priceLists.length === 0 ? (
            <p className="text-sm text-muted-foreground">No price lists uploaded yet.</p>
          ) : (
            priceLists.map((pl) => (
              <div key={pl.id} className="rounded-lg border px-3 py-2 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-wrap">
                    <Badge variant={pl.isActive ? "default" : "secondary"} className="shrink-0 text-xs">
                      {pl.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <span className="font-medium text-sm truncate">{pl.supplier}{pl.name ? ` — ${pl.name}` : ""}</span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {pl.itemCount} items · {pl.uploadedAt ? new Date(pl.uploadedAt).toLocaleDateString("de-DE") : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (editingDatesId === pl.id) {
                          setEditingDatesId(null);
                        } else {
                          setEditingDatesId(pl.id);
                          setEditName(pl.name || "");
                          setEditValidFrom(pl.validFrom ? new Date(pl.validFrom).toISOString().split("T")[0] : "");
                          setEditValidTo(pl.validTo ? new Date(pl.validTo).toISOString().split("T")[0] : "");
                        }
                      }}
                      data-testid={`button-edit-dates-${pl.id}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      <span className="ml-1 text-xs">Edit</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setViewingId(viewingId === pl.id ? null : pl.id)}
                      data-testid={`button-view-items-${pl.id}`}
                    >
                      {viewingId === pl.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      <span className="ml-1 text-xs">Items</span>
                    </Button>
                    {!pl.isActive && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteMutation.mutate(pl.id)}
                        disabled={deleteMutation.isPending}
                        data-testid={`button-delete-pl-${pl.id}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>

                {(pl.validFrom || pl.validTo) && editingDatesId !== pl.id && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {pl.validFrom ? new Date(pl.validFrom).toLocaleDateString("de-DE") : "—"}
                      {" → "}
                      {pl.validTo ? new Date(pl.validTo).toLocaleDateString("de-DE") : "—"}
                    </span>
                  </div>
                )}

                {editingDatesId === pl.id && (
                  <div className="space-y-2 p-2 rounded-md bg-muted/50">
                    <div className="space-y-1">
                      <Label className="text-xs">Name / Number</Label>
                      <Input
                        placeholder="e.g. #65"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-8 text-xs"
                        data-testid={`input-edit-name-${pl.id}`}
                      />
                    </div>
                    <div className="flex items-end gap-2">
                      <div className="space-y-1 flex-1">
                        <Label className="text-xs">Valid From</Label>
                        <Input
                          type="date"
                          value={editValidFrom}
                          onChange={(e) => setEditValidFrom(e.target.value)}
                          className="h-8 text-xs"
                          data-testid={`input-edit-valid-from-${pl.id}`}
                        />
                      </div>
                      <div className="space-y-1 flex-1">
                        <Label className="text-xs">Valid To</Label>
                        <Input
                          type="date"
                          value={editValidTo}
                          onChange={(e) => setEditValidTo(e.target.value)}
                          className="h-8 text-xs"
                          data-testid={`input-edit-valid-to-${pl.id}`}
                        />
                      </div>
                      <Button
                        size="sm"
                        className="h-8"
                        onClick={() => updateDatesMutation.mutate(pl.id)}
                        disabled={updateDatesMutation.isPending}
                        data-testid={`button-save-dates-${pl.id}`}
                      >
                        {updateDatesMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
                      </Button>
                    </div>
                  </div>
                )}

                {viewingId === pl.id && (
                  <div className="overflow-x-auto max-h-60 overflow-y-auto rounded border">
                    {viewLoading ? (
                      <div className="p-3 flex items-center gap-2 text-muted-foreground text-sm">
                        <Loader2 className="h-3 w-3 animate-spin" /> Loading items…
                      </div>
                    ) : (
                      <table className="w-full text-xs">
                        <thead className="bg-muted sticky top-0">
                          <tr>
                            <th className="px-2 py-1.5 text-left font-medium">Type</th>
                            <th className="px-2 py-1.5 text-left font-medium">SKU / UPC</th>
                            <th className="px-2 py-1.5 text-left font-medium">Product Name</th>
                            <th className="px-2 py-1.5 text-right font-medium">Dealer (net)</th>
                            <th className="px-2 py-1.5 text-right font-medium">MSRP (gross)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {viewItems.map((item) => (
                            <tr key={item.id} className="border-t" data-testid={`row-item-${item.id}`}>
                              <td className="px-2 py-1"><TypeBadge type={item.productType} /></td>
                              <td className="px-2 py-1 font-mono text-[10px]">{item.sku}</td>
                              <td className="px-2 py-1">{item.productName}</td>
                              <td className="px-2 py-1 text-right text-muted-foreground">
                                {item.dealerPrice ? `€${parseFloat(item.dealerPrice).toLocaleString("de-DE", { minimumFractionDigits: 2 })}` : "—"}
                              </td>
                              <td className="px-2 py-1 text-right font-medium">€{parseFloat(item.retailPrice).toLocaleString("de-DE", { minimumFractionDigits: 2 })}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
