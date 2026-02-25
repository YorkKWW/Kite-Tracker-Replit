import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, FileDown, CheckCircle, Clock, Receipt, Euro } from "lucide-react";
import type { SalesInvoice } from "@shared/schema";

type SaleRow = SalesInvoice & { customerName: string; itemCount: number };

const PAY_LABELS: Record<string, string> = {
  bank_transfer: "Bank Transfer",
  cash: "Cash",
  paypal: "PayPal",
  credit_card: "Credit Card",
};

const VAT_LABELS: Record<string, string> = {
  standard_19: "19% MwSt.",
  differenzbesteuerung: "§25a UStG",
  kleinunternehmer: "§19 UStG",
  eu_delivery: "§4 Nr.1b UStG",
  custom: "Custom",
};

export default function SalesPage() {
  const { toast } = useToast();
  const { data: sales = [], isLoading } = useQuery<SaleRow[]>({ queryKey: ["/api/sales"] });

  const confirmMutation = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/sales/${id}/confirm`).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      toast({ title: "Sale confirmed — equipment marked as Sold" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const totalRevenue = sales.filter((s) => s.status === "confirmed").reduce((sum, s) => sum + parseFloat(s.totalGross), 0);

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-sales-title">Sales</h1>
          <p className="text-sm text-muted-foreground">Outgoing invoices for used equipment</p>
        </div>
        <Link href="/sales/new">
          <Button data-testid="button-new-sale">
            <Plus className="h-4 w-4 mr-2" /> Create Invoice
          </Button>
        </Link>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Invoices", value: sales.length, icon: Receipt },
          { label: "Confirmed", value: sales.filter((s) => s.status === "confirmed").length, icon: CheckCircle },
          { label: "Draft", value: sales.filter((s) => s.status === "draft").length, icon: Clock },
          { label: "Revenue (confirmed)", value: `€${totalRevenue.toFixed(2)}`, icon: Euro },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-3 flex items-center gap-3">
              <stat.icon className="h-5 w-5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                <p className="font-bold text-lg leading-tight" data-testid={`stat-${stat.label.toLowerCase().replace(/ /g, "-")}`}>{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Invoice list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">Loading...</div>
      ) : sales.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground space-y-2">
          <Receipt className="h-10 w-10 mx-auto opacity-30" />
          <p className="font-medium">No invoices yet</p>
          <p className="text-sm">Create your first sale invoice to get started.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sales.map((sale) => (
            <Card key={sale.id} className="hover:shadow-md transition-shadow" data-testid={`card-sale-${sale.id}`}>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-mono text-sm font-bold" data-testid={`text-invoice-number-${sale.id}`}>{sale.invoiceNumber}</span>
                      <Badge variant={sale.status === "confirmed" ? "default" : "secondary"} className="text-xs">
                        {sale.status === "confirmed" ? "Confirmed" : "Draft"}
                      </Badge>
                      <Badge variant="outline" className="text-xs">{PAY_LABELS[sale.paymentMethod] || sale.paymentMethod}</Badge>
                      <Badge variant="outline" className="text-xs">{VAT_LABELS[sale.vatType] || sale.vatType}</Badge>
                    </div>
                    <p className="text-sm font-medium" data-testid={`text-customer-${sale.id}`}>{sale.customerName}</p>
                    <p className="text-xs text-muted-foreground">
                      {sale.invoiceDate} · {sale.itemCount} item{sale.itemCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-lg" data-testid={`text-total-${sale.id}`}>€{parseFloat(sale.totalGross).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">incl. VAT</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
                  <a
                    href={`/api/sales/${sale.id}/pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border hover:bg-muted transition-colors"
                    data-testid={`button-pdf-${sale.id}`}
                  >
                    <FileDown className="h-3.5 w-3.5" /> Download PDF
                  </a>
                  {sale.status === "draft" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7 border-green-500 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950"
                      onClick={() => confirmMutation.mutate(sale.id)}
                      disabled={confirmMutation.isPending}
                      data-testid={`button-confirm-${sale.id}`}
                    >
                      <CheckCircle className="h-3.5 w-3.5 mr-1" /> Confirm Sale
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
