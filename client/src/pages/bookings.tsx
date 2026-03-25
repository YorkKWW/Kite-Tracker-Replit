import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Receipt, Plus, Trash2, Loader2, FileDown, Mail, Search,
  CheckCircle, CreditCard, Banknote, XCircle, ChevronDown, ChevronUp,
} from "lucide-react";

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

type SchoolCustomer = {
  id: number;
  schoolConfigId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

type BookingItem = {
  id?: number;
  productId: number | null;
  productName: string;
  category: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
};

type Booking = {
  id: number;
  schoolConfigId: number;
  bookingNumber: string;
  customerId: number | null;
  customerName: string;
  customerEmail: string | null;
  paymentStatus: "unpaid" | "cash" | "credit_card";
  totalAmount: string;
  currency: string;
  notes: string | null;
  createdAt: string;
  createdBy: number | null;
  createdByName: string | null;
  items: BookingItem[];
};

const PAYMENT_LABELS: Record<string, { label: string; color: string; icon: any }> = {
  unpaid: { label: "Unpaid", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200", icon: XCircle },
  cash: { label: "Cash", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200", icon: Banknote },
  credit_card: { label: "Credit Card", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200", icon: CreditCard },
};

const CATEGORY_COLORS: Record<string, string> = {
  Course: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  Lesson: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  Package: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  Rental: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  Other: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
};

export default function BookingsPage() {
  const { isAdmin, isStationLead } = useAuth();
  const { toast } = useToast();
  const canCreate = isAdmin || isStationLead;

  const [selectedSchoolId, setSelectedSchoolId] = useState<number | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [detailBooking, setDetailBooking] = useState<Booking | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPayment, setFilterPayment] = useState<string>("all");

  const { data: schoolConfigs = [], isLoading: configsLoading } = useQuery<SchoolConfig[]>({
    queryKey: ["/api/school-configs"],
  });

  const { data: bookings = [], isLoading: bookingsLoading } = useQuery<Booking[]>({
    queryKey: ["/api/school-bookings", selectedSchoolId],
    enabled: !!selectedSchoolId,
    staleTime: 0,
  });

  const { data: products = [] } = useQuery<SchoolProduct[]>({
    queryKey: ["/api/school-products", selectedSchoolId],
    enabled: !!selectedSchoolId,
  });

  const { data: customers = [] } = useQuery<SchoolCustomer[]>({
    queryKey: ["/api/school-customers", selectedSchoolId],
    enabled: !!selectedSchoolId,
  });

  const selectedConfig = schoolConfigs.find(c => c.id === selectedSchoolId);

  const filteredBookings = useMemo(() => {
    let result = bookings;
    if (filterPayment !== "all") {
      result = result.filter(b => b.paymentStatus === filterPayment);
    }
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      result = result.filter(b =>
        b.bookingNumber.toLowerCase().includes(s) ||
        b.customerName.toLowerCase().includes(s) ||
        (b.customerEmail || "").toLowerCase().includes(s)
      );
    }
    return result;
  }, [bookings, filterPayment, searchTerm]);

  const paymentUpdateMutation = useMutation({
    mutationFn: ({ id, paymentStatus }: { id: number; paymentStatus: string }) =>
      apiRequest("PATCH", `/api/school-bookings/${id}/payment`, { paymentStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/school-bookings", selectedSchoolId] });
      toast({ title: "Payment status updated" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const emailMutation = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/school-bookings/${id}/email`),
    onSuccess: () => toast({ title: "Receipt emailed to customer" }),
    onError: (e: any) => toast({ title: "Email failed", description: e.message, variant: "destructive" }),
  });

  function formatPrice(price: string, curr: string) {
    return `${curr} ${parseFloat(price).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  if (!isAdmin && !isStationLead) {
    return (
      <div className="p-8 text-center text-muted-foreground" data-testid="text-access-denied">
        Admin or Center Manager access required.
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Receipt className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-page-title">Bookings</h1>
            <p className="text-sm text-muted-foreground">School bookings & receipts</p>
          </div>
        </div>
        {canCreate && selectedSchoolId && (
          <Button onClick={() => setShowCreateDialog(true)} data-testid="btn-create-booking">
            <Plus className="h-4 w-4 mr-1" /> New Booking
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={selectedSchoolId ? String(selectedSchoolId) : "__none__"}
          onValueChange={v => setSelectedSchoolId(v === "__none__" ? null : parseInt(v))}
        >
          <SelectTrigger className="w-64" data-testid="select-school">
            <SelectValue placeholder="Select a school..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">Select a school...</SelectItem>
            {schoolConfigs.filter(c => c.isActive).map(c => (
              <SelectItem key={c.id} value={String(c.id)} data-testid={`option-school-${c.id}`}>
                {c.schoolName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedSchoolId && (
          <>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search bookings..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 w-48"
                data-testid="input-search-bookings"
              />
            </div>
            <Select value={filterPayment} onValueChange={setFilterPayment}>
              <SelectTrigger className="w-40" data-testid="select-filter-payment">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="credit_card">Credit Card</SelectItem>
              </SelectContent>
            </Select>
          </>
        )}
      </div>

      {!selectedSchoolId ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {configsLoading ? (
              <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : (
              <p>Select a school to view and create bookings.</p>
            )}
          </CardContent>
        </Card>
      ) : bookingsLoading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
      ) : filteredBookings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p>{bookings.length === 0 ? "No bookings yet. Create your first booking!" : "No bookings match your filters."}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredBookings.map(booking => {
            const pay = PAYMENT_LABELS[booking.paymentStatus];
            const PayIcon = pay.icon;
            return (
              <Card
                key={booking.id}
                data-testid={`card-booking-${booking.id}`}
                className="cursor-pointer hover:border-primary/30 transition-colors"
                onClick={() => setDetailBooking(booking)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-sm text-primary" data-testid={`text-booking-number-${booking.id}`}>
                          {booking.bookingNumber}
                        </span>
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${pay.color}`}>
                          <PayIcon className="h-3 w-3" />
                          {pay.label}
                        </span>
                      </div>
                      <p className="text-sm font-medium mt-1">{booking.customerName}</p>
                      <p className="text-xs text-muted-foreground">
                        {booking.items.length} item{booking.items.length !== 1 ? "s" : ""} · {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString("de-DE") : ""}
                        {booking.createdByName && ` · by ${booking.createdByName}`}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-base" data-testid={`text-booking-total-${booking.id}`}>
                        {formatPrice(booking.totalAmount, booking.currency)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {showCreateDialog && selectedSchoolId && selectedConfig && (
        <CreateBookingDialog
          schoolConfigId={selectedSchoolId}
          currency={selectedConfig.currency}
          products={products.filter(p => p.isActive)}
          customers={customers}
          onClose={() => setShowCreateDialog(false)}
          onCreated={() => {
            setShowCreateDialog(false);
            queryClient.invalidateQueries({ queryKey: ["/api/school-bookings", selectedSchoolId] });
          }}
        />
      )}

      {detailBooking && (
        <BookingDetailDialog
          booking={detailBooking}
          canEdit={canCreate}
          onClose={() => setDetailBooking(null)}
          onPaymentUpdate={(status) => {
            paymentUpdateMutation.mutate({ id: detailBooking.id, paymentStatus: status });
            setDetailBooking({ ...detailBooking, paymentStatus: status as any });
          }}
          onEmail={() => emailMutation.mutate(detailBooking.id)}
          emailPending={emailMutation.isPending}
        />
      )}
    </div>
  );
}

function CreateBookingDialog({
  schoolConfigId, currency, products, customers, onClose, onCreated,
}: {
  schoolConfigId: number;
  currency: string;
  products: SchoolProduct[];
  customers: SchoolCustomer[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const { toast } = useToast();

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("__none__");
  const [paymentStatus, setPaymentStatus] = useState("unpaid");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<{ productId: number | null; productName: string; category: string; quantity: number; unitPrice: string }[]>([]);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [productSearch, setProductSearch] = useState("");

  const { data: nextNum } = useQuery<{ bookingNumber: string }>({
    queryKey: ["/api/school-bookings/next-number", schoolConfigId],
    staleTime: 0,
  });

  function selectCustomer(id: string) {
    setSelectedCustomerId(id);
    if (id !== "__none__") {
      const cust = customers.find(c => c.id === parseInt(id));
      if (cust) {
        setCustomerName(`${cust.firstName} ${cust.lastName}`);
        setCustomerEmail(cust.email);
      }
    }
  }

  function addProduct(product: SchoolProduct) {
    setItems(prev => [...prev, {
      productId: product.id,
      productName: product.name,
      category: product.category,
      quantity: 1,
      unitPrice: product.defaultPrice,
    }]);
    setShowProductPicker(false);
    setProductSearch("");
  }

  function removeItem(idx: number) {
    setItems(prev => prev.filter((_, i) => i !== idx));
  }

  function updateItem(idx: number, field: string, value: any) {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  }

  const totalAmount = items.reduce((sum, i) => sum + (parseFloat(i.unitPrice) || 0) * i.quantity, 0);

  const filteredProducts = useMemo(() => {
    const usedIds = new Set(items.map(i => i.productId));
    let available = products.filter(p => !usedIds.has(p.id));
    if (productSearch) {
      const s = productSearch.toLowerCase();
      available = available.filter(p => p.name.toLowerCase().includes(s) || p.category.toLowerCase().includes(s));
    }
    return available;
  }, [products, items, productSearch]);

  const createMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/school-bookings", {
        schoolConfigId,
        customerId: selectedCustomerId !== "__none__" ? parseInt(selectedCustomerId) : null,
        customerName,
        customerEmail: customerEmail || null,
        paymentStatus,
        notes: notes || null,
        currency,
        items: items.map(i => ({
          productId: i.productId,
          productName: i.productName,
          category: i.category,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          lineTotal: String((parseFloat(i.unitPrice) || 0) * i.quantity),
        })),
      }).then(r => r.json()),
    onSuccess: (booking: Booking) => {
      toast({ title: `Booking ${booking.bookingNumber} created` });
      onCreated();
    },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const canSubmit = customerName.trim() && items.length > 0 && items.every(i => parseFloat(i.unitPrice) > 0);

  return (
    <Dialog open onOpenChange={o => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            New Booking
            {nextNum && <span className="text-xs font-mono text-muted-foreground ml-2">{nextNum.bookingNumber}</span>}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-medium">Customer</Label>
            {customers.length > 0 && (
              <Select value={selectedCustomerId} onValueChange={selectCustomer}>
                <SelectTrigger data-testid="select-booking-customer">
                  <SelectValue placeholder="Select existing..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Manual entry</SelectItem>
                  {customers.map(c => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.firstName} {c.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Input
              placeholder="Customer name *"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              data-testid="input-booking-customer-name"
            />
            <Input
              placeholder="Email (optional)"
              type="email"
              value={customerEmail}
              onChange={e => setCustomerEmail(e.target.value)}
              data-testid="input-booking-customer-email"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Items</Label>
              <Button variant="outline" size="sm" onClick={() => setShowProductPicker(!showProductPicker)} data-testid="btn-add-booking-item">
                <Plus className="h-3 w-3 mr-1" /> Add Product
              </Button>
            </div>

            {showProductPicker && (
              <div className="border rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto bg-muted/30">
                <div className="relative">
                  <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                    placeholder="Search products..."
                    className="h-8 pl-7 text-xs"
                    data-testid="input-search-products"
                    autoFocus
                  />
                </div>
                {filteredProducts.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-2">No products available</p>
                ) : (
                  filteredProducts.map(p => (
                    <button
                      key={p.id}
                      className="w-full text-left px-2 py-1.5 rounded hover:bg-muted transition-colors flex items-center justify-between"
                      onClick={() => addProduct(p)}
                      data-testid={`btn-select-product-${p.id}`}
                    >
                      <div>
                        <p className="text-xs font-medium">{p.name}</p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${CATEGORY_COLORS[p.category] || ""}`}>{p.category}</span>
                      </div>
                      <span className="text-xs font-mono text-muted-foreground">{currency} {p.defaultPrice}</span>
                    </button>
                  ))
                )}
              </div>
            )}

            {items.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">No items added yet.</p>
            ) : (
              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div key={idx} className="border rounded-lg p-2.5 space-y-1.5" data-testid={`booking-item-${idx}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{item.productName}</p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${CATEGORY_COLORS[item.category] || ""}`}>{item.category}</span>
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => removeItem(idx)} data-testid={`btn-remove-item-${idx}`}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-0.5">
                        <Label className="text-[10px]">Qty</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={e => updateItem(idx, "quantity", parseInt(e.target.value) || 1)}
                          className="h-7 text-xs"
                          data-testid={`input-item-qty-${idx}`}
                        />
                      </div>
                      <div className="space-y-0.5">
                        <Label className="text-[10px]">Price ({currency})</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={e => updateItem(idx, "unitPrice", e.target.value)}
                          className="h-7 text-xs"
                          data-testid={`input-item-price-${idx}`}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-right font-mono">
                      = {currency} {((parseFloat(item.unitPrice) || 0) * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium">Payment Status</Label>
            <Select value={paymentStatus} onValueChange={setPaymentStatus}>
              <SelectTrigger data-testid="select-payment-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unpaid">Unpaid</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="credit_card">Credit Card</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium">Notes</Label>
            <Textarea
              placeholder="Optional notes..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              data-testid="input-booking-notes"
            />
          </div>

          {items.length > 0 && (
            <div className="border-t pt-3">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-lg" data-testid="text-booking-total">
                  {currency} {totalAmount.toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} data-testid="btn-cancel-booking">Cancel</Button>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={!canSubmit || createMutation.isPending}
            data-testid="btn-submit-booking"
          >
            {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Booking
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BookingDetailDialog({
  booking, canEdit, onClose, onPaymentUpdate, onEmail, emailPending,
}: {
  booking: Booking;
  canEdit: boolean;
  onClose: () => void;
  onPaymentUpdate: (status: string) => void;
  onEmail: () => void;
  emailPending: boolean;
}) {
  const pay = PAYMENT_LABELS[booking.paymentStatus];
  const PayIcon = pay.icon;

  return (
    <Dialog open onOpenChange={o => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            {booking.bookingNumber}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Customer</p>
              <p className="font-medium">{booking.customerName}</p>
              {booking.customerEmail && <p className="text-xs text-muted-foreground">{booking.customerEmail}</p>}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Date</p>
              <p className="font-medium">{booking.createdAt ? new Date(booking.createdAt).toLocaleDateString("de-DE") : "—"}</p>
              {booking.createdByName && <p className="text-xs text-muted-foreground">by {booking.createdByName}</p>}
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-1">Payment Status</p>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${pay.color}`}>
                <PayIcon className="h-3.5 w-3.5" />
                {pay.label}
              </span>
              {canEdit && (
                <Select value={booking.paymentStatus} onValueChange={onPaymentUpdate}>
                  <SelectTrigger className="h-7 w-32 text-xs" data-testid="select-update-payment">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="credit_card">Credit Card</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-2">Items</p>
            <div className="border rounded-lg overflow-hidden">
              {booking.items.map((item, idx) => (
                <div key={item.id || idx} className={`flex items-center justify-between p-2.5 text-sm ${idx % 2 === 0 ? "bg-muted/30" : ""}`} data-testid={`detail-item-${idx}`}>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm">{item.productName}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${CATEGORY_COLORS[item.category] || ""}`}>{item.category}</span>
                      <span className="text-xs text-muted-foreground">× {item.quantity}</span>
                    </div>
                  </div>
                  <span className="font-mono text-sm shrink-0">
                    {booking.currency} {parseFloat(item.lineTotal).toFixed(2)}
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between p-3 border-t font-bold">
                <span>Total</span>
                <span className="text-lg" data-testid="text-detail-total">
                  {booking.currency} {parseFloat(booking.totalAmount).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {booking.notes && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Notes</p>
              <p className="text-sm bg-muted/30 rounded p-2">{booking.notes}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-2">
            <a
              href={`/api/school-bookings/${booking.id}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-sm font-medium hover:bg-muted transition-colors"
              data-testid="btn-download-receipt"
            >
              <FileDown className="h-4 w-4" /> Download PDF
            </a>
            {booking.customerEmail && (
              <Button
                variant="outline"
                size="sm"
                onClick={onEmail}
                disabled={emailPending}
                data-testid="btn-email-receipt"
              >
                {emailPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Mail className="h-4 w-4 mr-1" />}
                Email Receipt
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
