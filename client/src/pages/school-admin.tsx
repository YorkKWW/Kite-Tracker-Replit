import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { GraduationCap, Plus, Pencil, Building2, BookOpen } from "lucide-react";
import type { Station } from "@shared/schema";

const CURRENCIES = ["MAD", "EUR", "BRL"] as const;
const CATEGORIES = ["Course", "Lesson", "Package", "Rental", "Other"] as const;

type SchoolConfigWithStation = {
  id: number;
  stationId: number;
  schoolName: string;
  currency: string;
  isActive: boolean;
  contactEmail: string | null;
  stationName: string;
};

type SchoolProduct = {
  id: number;
  schoolConfigId: number;
  name: string;
  description: string | null;
  category: string;
  defaultPrice: string;
  isActive: boolean;
  sortOrder: number;
};

const CATEGORY_COLORS: Record<string, string> = {
  Course: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  Lesson: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  Package: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  Rental: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  Other: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
};

export default function SchoolAdminPage() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();

  const [selectedSchoolId, setSelectedSchoolId] = useState<number | null>(null);
  const [showEnableDialog, setShowEnableDialog] = useState(false);
  const [enableStationId, setEnableStationId] = useState<number | null>(null);
  const [editConfigId, setEditConfigId] = useState<number | null>(null);
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [editProduct, setEditProduct] = useState<SchoolProduct | null>(null);

  // School config form state
  const [schoolName, setSchoolName] = useState("");
  const [currency, setCurrency] = useState<string>("MAD");

  // Product form state
  const [prodName, setProdName] = useState("");
  const [prodDesc, setProdDesc] = useState("");
  const [prodCategory, setProdCategory] = useState<string>("Course");
  const [prodPrice, setProdPrice] = useState("");
  const [prodSortOrder, setProdSortOrder] = useState("0");

  const { data: stations = [] } = useQuery<Station[]>({ queryKey: ["/api/stations"] });
  const { data: schoolConfigs = [], isLoading: configsLoading } = useQuery<SchoolConfigWithStation[]>({
    queryKey: ["/api/school-configs"],
  });
  const { data: products = [], isLoading: productsLoading } = useQuery<SchoolProduct[]>({
    queryKey: ["/api/school-products", selectedSchoolId],
    enabled: !!selectedSchoolId,
  });

  const configuredStationIds = new Set(schoolConfigs.map(c => c.stationId));
  const selectedConfig = schoolConfigs.find(c => c.id === selectedSchoolId);

  const createConfigMutation = useMutation({
    mutationFn: (data: object) => apiRequest("POST", "/api/school-configs", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/school-configs"] });
      setShowEnableDialog(false);
      toast({ title: "School enabled" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateConfigMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: object }) => apiRequest("PATCH", `/api/school-configs/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/school-configs"] });
      setEditConfigId(null);
      toast({ title: "School updated" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const createProductMutation = useMutation({
    mutationFn: (data: object) => apiRequest("POST", "/api/school-products", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/school-products", selectedSchoolId] });
      setShowProductDialog(false);
      resetProductForm();
      toast({ title: "Product added" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: object }) => apiRequest("PATCH", `/api/school-products/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/school-products", selectedSchoolId] });
      setShowProductDialog(false);
      setEditProduct(null);
      resetProductForm();
      toast({ title: "Product updated" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  function resetProductForm() {
    setProdName(""); setProdDesc(""); setProdCategory("Course");
    setProdPrice(""); setProdSortOrder("0");
  }

  function openEnableDialog(stationId: number) {
    setEnableStationId(stationId);
    setSchoolName(""); setCurrency("MAD");
    setShowEnableDialog(true);
  }

  function openEditConfig(config: SchoolConfigWithStation) {
    setEditConfigId(config.id);
    setSchoolName(config.schoolName);
    setCurrency(config.currency);
  }

  function openAddProduct() {
    setEditProduct(null);
    resetProductForm();
    setShowProductDialog(true);
  }

  function openEditProduct(p: SchoolProduct) {
    setEditProduct(p);
    setProdName(p.name);
    setProdDesc(p.description ?? "");
    setProdCategory(p.category);
    setProdPrice(p.defaultPrice);
    setProdSortOrder(String(p.sortOrder));
    setShowProductDialog(true);
  }

  function formatPrice(price: string, curr: string) {
    return `${curr} ${parseFloat(price).toLocaleString("de-DE", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  }

  if (!isAdmin) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Admin access required.
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <GraduationCap className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">School Admin</h1>
          <p className="text-sm text-muted-foreground">Manage kite schools per station</p>
        </div>
      </div>

      {/* Section 1 — School Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4" />
            School Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          {configsLoading ? (
            <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : (
            <div className="space-y-3">
              {stations
                .filter(s => !["In Transfer", "Office Hamburg Warehouse", "Service Center Heidenau"].includes(s.name))
                .map(station => {
                  const config = schoolConfigs.find(c => c.stationId === station.id);
                  return (
                    <div
                      key={station.id}
                      data-testid={`station-school-row-${station.id}`}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-sm">{station.name}</span>
                        {config ? (
                          <Badge variant="outline" className="text-xs text-green-700 border-green-300 bg-green-50 dark:bg-green-900/20 dark:text-green-400">
                            {config.schoolName}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-muted-foreground">No school</Badge>
                        )}
                        {config && !config.isActive && (
                          <Badge variant="secondary" className="text-xs">Inactive</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {config ? (
                          <>
                            <span className="text-xs text-muted-foreground">{config.currency}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              data-testid={`btn-edit-school-${config.id}`}
                              onClick={() => openEditConfig(config)}
                            >
                              <Pencil className="h-3 w-3 mr-1" /> Edit
                            </Button>
                            <Button
                              variant={config.isActive ? "secondary" : "outline"}
                              size="sm"
                              data-testid={`btn-toggle-school-${config.id}`}
                              onClick={() => updateConfigMutation.mutate({ id: config.id, data: { isActive: !config.isActive } })}
                            >
                              {config.isActive ? "Deactivate" : "Activate"}
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            data-testid={`btn-enable-school-${station.id}`}
                            onClick={() => openEnableDialog(station.id)}
                          >
                            <Plus className="h-3 w-3 mr-1" /> Enable School
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 2 — Product Catalog */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="h-4 w-4" />
              Product Catalog
            </CardTitle>
            {selectedSchoolId && isAdmin && (
              <Button size="sm" data-testid="btn-add-product" onClick={openAddProduct}>
                <Plus className="h-3 w-3 mr-1" /> Add Product
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Select
              value={selectedSchoolId ? String(selectedSchoolId) : "__none__"}
              onValueChange={v => setSelectedSchoolId(v === "__none__" ? null : parseInt(v))}
            >
              <SelectTrigger className="w-64" data-testid="select-school">
                <SelectValue placeholder="Select a school..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Select a school...</SelectItem>
                {schoolConfigs.map(c => (
                  <SelectItem key={c.id} value={String(c.id)} data-testid={`option-school-${c.id}`}>
                    {c.schoolName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!selectedSchoolId ? (
            <p className="text-sm text-muted-foreground py-4">Select a school to manage its products.</p>
          ) : productsLoading ? (
            <div className="space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : products.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No products yet.</p>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-center">Sort</TableHead>
                    <TableHead className="text-center">Active</TableHead>
                    <TableHead className="w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map(p => (
                    <TableRow key={p.id} data-testid={`row-product-${p.id}`} className={!p.isActive ? "opacity-50" : ""}>
                      <TableCell className="font-medium">
                        <div>{p.name}</div>
                        {p.description && <div className="text-xs text-muted-foreground">{p.description}</div>}
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[p.category] ?? ""}`}>
                          {p.category}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatPrice(p.defaultPrice, selectedConfig?.currency ?? "MAD")}
                      </TableCell>
                      <TableCell className="text-center text-sm">{p.sortOrder}</TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={p.isActive}
                          data-testid={`toggle-product-${p.id}`}
                          onCheckedChange={v => updateProductMutation.mutate({ id: p.id, data: { isActive: v } })}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          data-testid={`btn-edit-product-${p.id}`}
                          onClick={() => openEditProduct(p)}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enable School Dialog */}
      <Dialog open={showEnableDialog} onOpenChange={setShowEnableDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enable School</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="school-name">School Name</Label>
              <Input
                id="school-name"
                data-testid="input-school-name"
                placeholder="KiteWorldWide Dakhla School"
                value={schoolName}
                onChange={e => setSchoolName(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="school-currency">Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger data-testid="select-currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEnableDialog(false)}>Cancel</Button>
            <Button
              data-testid="btn-confirm-enable-school"
              disabled={!schoolName.trim() || createConfigMutation.isPending}
              onClick={() => createConfigMutation.mutate({
                stationId: enableStationId,
                schoolName: schoolName.trim(),
                currency,
                isActive: true,
              })}
            >
              Enable School
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit School Config Dialog */}
      <Dialog open={!!editConfigId} onOpenChange={open => { if (!open) setEditConfigId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit School</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>School Name</Label>
              <Input
                data-testid="input-edit-school-name"
                value={schoolName}
                onChange={e => setSchoolName(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger data-testid="select-edit-currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditConfigId(null)}>Cancel</Button>
            <Button
              data-testid="btn-save-school"
              disabled={!schoolName.trim() || updateConfigMutation.isPending}
              onClick={() => editConfigId && updateConfigMutation.mutate({
                id: editConfigId,
                data: {
                  schoolName: schoolName.trim(),
                  currency,
                },
              })}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Product Dialog */}
      <Dialog open={showProductDialog} onOpenChange={open => { if (!open) { setShowProductDialog(false); setEditProduct(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editProduct ? "Edit Product" : "Add Product"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input
                data-testid="input-prod-name"
                placeholder="5-Day Beginner Course"
                value={prodName}
                onChange={e => setProdName(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Description (optional)</Label>
              <Textarea
                data-testid="input-prod-desc"
                placeholder="Short description..."
                value={prodDesc}
                onChange={e => setProdDesc(e.target.value)}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Category</Label>
                <Select value={prodCategory} onValueChange={setProdCategory}>
                  <SelectTrigger data-testid="select-prod-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Default Price ({selectedConfig?.currency ?? "MAD"})</Label>
                <Input
                  data-testid="input-prod-price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  value={prodPrice}
                  onChange={e => setProdPrice(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Sort Order</Label>
              <Input
                data-testid="input-prod-sort"
                type="number"
                value={prodSortOrder}
                onChange={e => setProdSortOrder(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowProductDialog(false); setEditProduct(null); }}>Cancel</Button>
            <Button
              data-testid="btn-save-product"
              disabled={!prodName.trim() || !prodPrice || createProductMutation.isPending || updateProductMutation.isPending}
              onClick={() => {
                const data = {
                  schoolConfigId: selectedSchoolId!,
                  name: prodName.trim(),
                  description: prodDesc.trim() || null,
                  category: prodCategory,
                  defaultPrice: prodPrice,
                  sortOrder: parseInt(prodSortOrder) || 0,
                };
                if (editProduct) {
                  updateProductMutation.mutate({ id: editProduct.id, data });
                } else {
                  createProductMutation.mutate(data);
                }
              }}
            >
              {editProduct ? "Save" : "Add Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
