import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Tag, TreePalm } from "lucide-react";

type SchoolConfig = {
  id: number;
  stationId: number;
  schoolName: string;
  currency: string;
  isActive: boolean;
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
  Other: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

function formatPrice(price: string | number, currency: string): string {
  const num = typeof price === "string" ? parseFloat(price) : price;
  return new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(num);
}

export default function SchoolProductsPage() {
  const { user, isAdmin } = useAuth();

  const { data: configs = [], isLoading: configsLoading } = useQuery<SchoolConfig[]>({
    queryKey: ["/api/school-configs"],
    staleTime: 60000,
  });

  const activeConfig = useMemo(() => {
    if (!user) return null;
    if (isAdmin) return configs[0] || null;
    return configs.find(c => c.stationId === user.assignedStationId && c.isActive) || null;
  }, [configs, user, isAdmin]);

  const { data: products = [], isLoading: productsLoading } = useQuery<SchoolProduct[]>({
    queryKey: ["/api/school-products", activeConfig?.id],
    queryFn: async () => {
      if (!activeConfig) return [];
      const res = await fetch(`/api/school-products?schoolConfigId=${activeConfig.id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
    enabled: !!activeConfig,
    staleTime: 0,
  });

  const sortedProducts = useMemo(() => {
    const active = products.filter(p => p.isActive);
    return active.sort((a, b) => {
      const catOrder = a.category.localeCompare(b.category);
      if (catOrder !== 0) return catOrder;
      return a.name.localeCompare(b.name);
    });
  }, [products]);

  if (configsLoading || productsLoading) {
    return <div className="p-4 space-y-3"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /></div>;
  }

  if (!activeConfig) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <TreePalm className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p>No school configured for your station.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Tag className="h-5 w-5" />
        <h1 className="text-lg font-bold" data-testid="text-products-title">
          {activeConfig.schoolName} — Products
        </h1>
      </div>

      {sortedProducts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Tag className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No products configured yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="border rounded-md overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="hidden sm:table-cell">Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedProducts.map((p) => (
                <TableRow key={p.id} data-testid={`row-product-${p.id}`}>
                  <TableCell className="font-medium" data-testid={`text-product-name-${p.id}`}>{p.name}</TableCell>
                  <TableCell>
                    <Badge className={`text-xs ${CATEGORY_COLORS[p.category] || CATEGORY_COLORS.Other}`}>
                      {p.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm" data-testid={`text-product-price-${p.id}`}>
                    {formatPrice(p.defaultPrice, activeConfig.currency)}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                    {p.description || "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
