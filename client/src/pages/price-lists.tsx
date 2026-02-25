import { useState, useRef } from "react";
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
  CheckCircle, XCircle, List, FileText, AlertTriangle,
} from "lucide-react";
import type { PriceList, PriceListItem } from "@shared/schema";

const KNOWN_SUPPLIERS = ["Core", "Duotone", "North", "Eleveight", "Cabrinha", "Ozone", "F-One"];

type ParsedItem = { sku: string; productName: string; retailPrice: string; dealerPrice: string | null; productType: string | null };

const TYPE_LABELS: Record<string, string> = {
  kite: "Kite", board: "Board", foilboard: "Foilboard", foil: "Foil",
  wing: "Wing", bar_lines: "Bar", wetsuit: "Wetsuit", harness: "Harness", helmet_safety: "Helmet",
};
const TYPE_COLORS: Record<string, string> = {
  kite: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  board: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  foilboard: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
  foil: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  wing: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  bar_lines: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  wetsuit: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  harness: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  helmet_safety: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
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
  const [parsedItems, setParsedItems] = useState<ParsedItem[] | null>(null);
  const [removedRows, setRemovedRows] = useState<Set<number>>(new Set());
  const [expandPreview, setExpandPreview] = useState(false);
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
      return res.json() as Promise<{ items: ParsedItem[]; rawLineCount: number }>;
    },
    onSuccess: (data) => {
      setParsedItems(data.items);
      setRemovedRows(new Set());
      setExpandPreview(true);
      if (data.items.length === 0) {
        toast({ title: "No items extracted", description: `Parser processed ${data.rawLineCount} lines but found no matching SKU + price rows. The PDF format may not be supported.`, variant: "destructive" });
      } else {
        toast({ title: `Extracted ${data.items.length} items`, description: `From ${data.rawLineCount} text lines in the PDF. Review below, then confirm to save.` });
      }
    },
    onError: (e: any) => toast({ title: "Parse failed", description: e.message, variant: "destructive" }),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const confirmed = parsedItems!.filter((_, i) => !removedRows.has(i));
      const res = await apiRequest("POST", "/api/price-lists", { supplier: effectiveSupplier, items: confirmed });
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
      setRemovedRows(new Set());
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
                      <span className="text-xs text-muted-foreground">
                        Active · {active.itemCount} items · {active.uploadedAt ? new Date(active.uploadedAt).toLocaleDateString("de-DE") : ""}
                      </span>
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
          ℹ️ <strong>Important:</strong> Only items with a UVP of €200 or more will be captured. Please review all imported items carefully and uncheck any that are not needed. If you encounter problems with the upload, please contact <a href="mailto:york@kite-worldwide.com" className="underline underline-offset-2 hover:opacity-80">york@kite-worldwide.com</a> with a description of the error.
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
                onChange={(e) => { setFile(e.target.files?.[0] || null); setParsedItems(null); }}
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
                        <th className="px-2 py-1.5 text-right font-medium">UVP (brutto)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedItems.map((item, i) => (
                        <tr
                          key={i}
                          className={`border-t cursor-pointer hover:bg-muted/50 ${removedRows.has(i) ? "opacity-40 line-through" : ""}`}
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
                          <td className="px-2 py-1 text-right font-medium">€{parseFloat(item.retailPrice).toLocaleString("de-DE", { minimumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
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
                  <div className="flex items-center gap-2 min-w-0">
                    <Badge variant={pl.isActive ? "default" : "secondary"} className="shrink-0 text-xs">
                      {pl.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <span className="font-medium text-sm truncate">{pl.supplier}</span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {pl.itemCount} items · {pl.uploadedAt ? new Date(pl.uploadedAt).toLocaleDateString("de-DE") : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
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
                            <th className="px-2 py-1.5 text-right font-medium">UVP (brutto)</th>
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
