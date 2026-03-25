import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";
import {
  Plus, Trash2, Loader2, FileDown, CheckCircle, CreditCard, Banknote, XCircle,
  ChevronDown, ChevronUp, Package as PackageIcon, Wrench as WrenchIcon,
  TrendingUp, Wallet, Fuel, UtensilsCrossed, Truck, UserCog, MoreHorizontal,
  Camera, DollarSign, MinusCircle, Store,
} from "lucide-react";
import type { SchoolConfig } from "@shared/schema";

type Booking = {
  id: number;
  schoolConfigId: number;
  customerId: number | null;
  customerName: string;
  customerEmail: string | null;
  bookingDate: string;
  bookingNumber: string;
  totalAmount: string;
  currency: string;
  paymentStatus: "unpaid" | "cash" | "credit_card";
  notes: string | null;
  items: { productName: string; category: string; quantity: number; unitPrice: string; lineTotal: string }[];
  createdByName: string | null;
};

const PAYMENT_LABELS: Record<string, { label: string; icon: LucideIcon; color: string }> = {
  cash: { label: "Cash", icon: Banknote, color: "text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-950" },
  credit_card: { label: "Card", icon: CreditCard, color: "text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-950" },
  unpaid: { label: "Unpaid", icon: XCircle, color: "text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-950" },
};

function formatPrice(price: string, curr: string) {
  return `${curr} ${parseFloat(price).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const EXPENSE_CATEGORIES: { value: string; label: string; icon: LucideIcon }[] = [
  { value: "fuel_gas", label: "Fuel / Gas", icon: Fuel },
  { value: "food_drinks", label: "Food / Drinks", icon: UtensilsCrossed },
  { value: "material_supplies", label: "Material / Supplies", icon: PackageIcon },
  { value: "transport", label: "Transport", icon: Truck },
  { value: "maintenance", label: "Maintenance", icon: WrenchIcon },
  { value: "staff", label: "Staff", icon: UserCog },
  { value: "other", label: "Other", icon: MoreHorizontal },
];

type FinancePeriod = "today" | "week" | "month" | "custom";

function getDateRange(period: FinancePeriod, customStart: string, customEnd: string): { startDate: string; endDate: string } {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
  const today = `${yyyy}-${mm}-${dd}`;

  if (period === "today") return { startDate: today, endDate: today };
  if (period === "week") {
    const d = new Date(Date.UTC(yyyy, now.getUTCMonth(), now.getUTCDate()));
    const day = d.getUTCDay();
    const diff = day === 0 ? 6 : day - 1;
    d.setUTCDate(d.getUTCDate() - diff);
    const ws = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
    return { startDate: ws, endDate: today };
  }
  if (period === "month") return { startDate: `${yyyy}-${mm}-01`, endDate: today };
  return { startDate: customStart || today, endDate: customEnd || today };
}

type SchoolExpenseLocal = {
  id: number;
  schoolConfigId: number;
  amount: string;
  currency: string;
  category: string;
  description: string | null;
  expenseDate: string;
  receiptUrl: string | null;
  createdBy: number | null;
  createdAt: string;
};

export default function FinancePage() {
  const { user, isAdmin, isStationLead, isSimulating, simStationId } = useAuth();
  const [selectedSchoolId, setSelectedSchoolId] = useState<number | null>(null);
  const [schoolResolved, setSchoolResolved] = useState(false);

  const { data: schoolConfigs = [] } = useQuery<SchoolConfig[]>({
    queryKey: ["/api/school-configs"],
    staleTime: 0,
  });

  useEffect(() => {
    if (schoolResolved || schoolConfigs.length === 0) return;
    if (isStationLead && user) {
      const stationId = isSimulating && simStationId ? simStationId : user?.assignedStationId;
      const match = schoolConfigs.find(c => c.stationId === stationId && c.isActive);
      if (match) {
        setSelectedSchoolId(match.id);
        setSchoolResolved(true);
      }
    } else if (isAdmin && !selectedSchoolId) {
      const active = schoolConfigs.find(c => c.isActive);
      if (active) {
        setSelectedSchoolId(active.id);
        setSchoolResolved(true);
      }
    }
  }, [schoolConfigs, isStationLead, isAdmin, user, schoolResolved, selectedSchoolId, isSimulating, simStationId]);

  const selectedConfig = schoolConfigs.find(c => c.id === selectedSchoolId);

  return (
    <div className="flex flex-col h-full" data-testid="finance-page">
      <div className="bg-background border-b px-4 py-3 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Wallet className="h-5 w-5 text-primary shrink-0" />
          {isAdmin && !isStationLead ? (
            <Select
              value={selectedSchoolId ? String(selectedSchoolId) : "__none__"}
              onValueChange={v => setSelectedSchoolId(v === "__none__" ? null : parseInt(v))}
            >
              <SelectTrigger className="h-8 w-52 text-sm" data-testid="select-finance-school">
                <SelectValue placeholder="Select school..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Select school...</SelectItem>
                {schoolConfigs.filter(c => c.isActive).map(c => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.schoolName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div>
              <p className="text-sm font-semibold">{selectedConfig?.schoolName ?? "Loading..."}</p>
              <p className="text-[11px] text-muted-foreground">{selectedConfig?.stationName}</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {selectedSchoolId && selectedConfig ? (
          <FinanceContent schoolConfigId={selectedSchoolId} currency={selectedConfig.currency} />
        ) : (
          <div className="p-8 text-center text-muted-foreground">Select a school to view finances.</div>
        )}
      </div>
    </div>
  );
}

function FinanceContent({ schoolConfigId, currency }: { schoolConfigId: number; currency: string }) {
  const { toast } = useToast();
  const [period, setPeriod] = useState<FinancePeriod>("month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expAmount, setExpAmount] = useState("");
  const [expCategory, setExpCategory] = useState("other");
  const [expDate, setExpDate] = useState(() => {
    const n = new Date();
    return `${n.getUTCFullYear()}-${String(n.getUTCMonth() + 1).padStart(2, "0")}-${String(n.getUTCDate()).padStart(2, "0")}`;
  });
  const [expDescription, setExpDescription] = useState("");
  const [expReceiptUrl, setExpReceiptUrl] = useState("");
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [cashBalance, setCashBalance] = useState("");
  const [cashSaving, setCashSaving] = useState(false);
  const [expandedBooking, setExpandedBooking] = useState<number | null>(null);
  const [viewReceiptUrl, setViewReceiptUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { startDate, endDate } = getDateRange(period, customStart, customEnd);

  type FinanceSummary = {
    paidTotal: string; cashTotal: string; cardTotal: string; unpaidTotal: string;
    expenseTotal: string; netResult: string; bookingCount: number; expenseCount: number;
  };

  const { data: summary } = useQuery<FinanceSummary>({
    queryKey: ["/api/finance-summary", schoolConfigId, startDate, endDate],
    queryFn: async () => {
      const res = await fetch(`/api/finance-summary/${schoolConfigId}?startDate=${startDate}&endDate=${endDate}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch finance summary");
      return res.json();
    },
    staleTime: 0,
  });

  const { data: bookings = [] } = useQuery<Booking[]>({
    queryKey: ["/api/school-bookings", schoolConfigId],
    staleTime: 0,
  });

  const { data: expenses = [] } = useQuery<SchoolExpenseLocal[]>({
    queryKey: ["/api/school-expenses", schoolConfigId, startDate, endDate],
    queryFn: async () => {
      const res = await fetch(`/api/school-expenses/${schoolConfigId}?startDate=${startDate}&endDate=${endDate}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch expenses");
      return res.json();
    },
    staleTime: 0,
  });

  const { data: cashEntry } = useQuery<{ openingBalance: string } | null>({
    queryKey: ["/api/cash-register", schoolConfigId, startDate],
    queryFn: async () => {
      const res = await fetch(`/api/cash-register/${schoolConfigId}/${startDate}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch cash register");
      return res.json();
    },
    staleTime: 0,
  });

  useEffect(() => {
    if (cashEntry?.openingBalance != null) {
      setCashBalance(cashEntry.openingBalance);
    } else {
      setCashBalance("");
    }
  }, [cashEntry]);

  const filteredBookings = useMemo(() => {
    return bookings
      .filter(b => b.bookingDate >= startDate && b.bookingDate <= endDate)
      .sort((a, b) => b.bookingDate.localeCompare(a.bookingDate) || b.id - a.id);
  }, [bookings, startDate, endDate]);

  const stats = useMemo(() => {
    const paidTotal = parseFloat(summary?.paidTotal || "0");
    const cashTotal = parseFloat(summary?.cashTotal || "0");
    const cardTotal = parseFloat(summary?.cardTotal || "0");
    const unpaidTotal = parseFloat(summary?.unpaidTotal || "0");
    const expenseTotal = parseFloat(summary?.expenseTotal || "0");
    const opening = parseFloat(cashBalance) || 0;
    const currentCash = opening + cashTotal - expenseTotal;
    const netResult = parseFloat(summary?.netResult || "0");
    return { paidTotal, cashTotal, cardTotal, unpaidTotal, expenseTotal, opening, currentCash, netResult };
  }, [summary, cashBalance]);

  const createExpenseMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/school-expenses", {
        schoolConfigId,
        amount: expAmount,
        currency,
        category: expCategory,
        description: expDescription || null,
        expenseDate: expDate,
        receiptUrl: expReceiptUrl || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/school-expenses", schoolConfigId] });
      queryClient.invalidateQueries({ queryKey: ["/api/finance-summary", schoolConfigId] });
      setShowExpenseForm(false);
      setExpAmount("");
      setExpCategory("other");
      setExpDescription("");
      setExpReceiptUrl("");
      toast({ title: "Expense added" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/school-expenses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/school-expenses", schoolConfigId] });
      queryClient.invalidateQueries({ queryKey: ["/api/finance-summary", schoolConfigId] });
      toast({ title: "Expense deleted" });
    },
  });

  const saveCashBalance = async () => {
    setCashSaving(true);
    try {
      await apiRequest("POST", "/api/cash-register", {
        schoolConfigId,
        date: startDate,
        openingBalance: cashBalance || "0",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/cash-register", schoolConfigId] });
      toast({ title: "Cash balance saved" });
    } catch {
      toast({ title: "Error saving cash balance", variant: "destructive" });
    } finally {
      setCashSaving(false);
    }
  };

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingReceipt(true);
    try {
      const metaRes = await fetch("/api/uploads/request-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
      });
      if (!metaRes.ok) throw new Error("Failed to get upload URL");
      const { uploadURL, objectPath } = await metaRes.json();
      const putRes = await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      if (!putRes.ok) throw new Error("Upload failed");
      setExpReceiptUrl(objectPath);
      toast({ title: "Receipt uploaded" });
    } catch (err: any) {
      toast({ title: "Upload error", description: err.message, variant: "destructive" });
    } finally {
      setUploadingReceipt(false);
    }
  };

  const fmt = (n: number) => formatPrice(String(n.toFixed(2)), currency);

  const periodButtons: { id: FinancePeriod; label: string }[] = [
    { id: "today", label: "Today" },
    { id: "week", label: "This Week" },
    { id: "month", label: "This Month" },
    { id: "custom", label: "Custom" },
  ];

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-3xl md:max-w-4xl mx-auto">
      <div className="flex flex-wrap gap-1.5" data-testid="finance-period-selector">
        {periodButtons.map(p => (
          <button
            key={p.id}
            data-testid={`btn-period-${p.id}`}
            onClick={() => setPeriod(p.id)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              period === p.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {period === "custom" && (
        <div className="flex gap-2 items-center">
          <Input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="w-36" data-testid="input-custom-start" />
          <span className="text-muted-foreground text-sm">to</span>
          <Input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="w-36" data-testid="input-custom-end" />
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          {startDate === endDate ? startDate : `${startDate} — ${endDate}`}
        </div>
        <div className="flex gap-1.5">
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            data-testid="btn-pnl-week"
            onClick={() => {
              const now = new Date();
              const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
              const day = d.getUTCDay();
              const diff = day === 0 ? 6 : day - 1;
              d.setUTCDate(d.getUTCDate() - diff);
              const ws = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
              const we = new Date(d);
              we.setUTCDate(we.getUTCDate() + 6);
              const weStr = `${we.getUTCFullYear()}-${String(we.getUTCMonth() + 1).padStart(2, "0")}-${String(we.getUTCDate()).padStart(2, "0")}`;
              window.open(`/api/finance-pnl/${schoolConfigId}/pdf?startDate=${ws}&endDate=${weStr}`, "_blank");
            }}
          >
            <FileDown className="h-3 w-3 mr-1" /> P&L Week
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            data-testid="btn-pnl-month"
            onClick={() => {
              const now = new Date();
              const ms = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-01`;
              const lastDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));
              const me = `${lastDay.getUTCFullYear()}-${String(lastDay.getUTCMonth() + 1).padStart(2, "0")}-${String(lastDay.getUTCDate()).padStart(2, "0")}`;
              window.open(`/api/finance-pnl/${schoolConfigId}/pdf?startDate=${ms}&endDate=${me}`, "_blank");
            }}
          >
            <FileDown className="h-3 w-3 mr-1" /> P&L Month
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card data-testid="card-total-revenue">
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-[11px] text-muted-foreground font-medium">Revenue</span>
            </div>
            <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{fmt(stats.paidTotal)}</p>
          </CardContent>
        </Card>
        <Card data-testid="card-cash-total">
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Banknote className="h-3.5 w-3.5 text-green-600" />
              <span className="text-[11px] text-muted-foreground font-medium">Cash</span>
            </div>
            <p className="text-lg font-bold">{fmt(stats.cashTotal)}</p>
          </CardContent>
        </Card>
        <Card data-testid="card-card-total">
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <CreditCard className="h-3.5 w-3.5 text-blue-600" />
              <span className="text-[11px] text-muted-foreground font-medium">Credit Card</span>
            </div>
            <p className="text-lg font-bold">{fmt(stats.cardTotal)}</p>
          </CardContent>
        </Card>
        <Card data-testid="card-unpaid-total">
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <XCircle className="h-3.5 w-3.5 text-red-600" />
              <span className="text-[11px] text-muted-foreground font-medium">Unpaid</span>
            </div>
            <p className="text-lg font-bold text-red-600 dark:text-red-400">{fmt(stats.unpaidTotal)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card data-testid="card-cash-register">
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Wallet className="h-3.5 w-3.5 text-amber-600" />
              <span className="text-[11px] text-muted-foreground font-medium">Cash Register</span>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Label className="text-xs w-16 shrink-0">Opening</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={cashBalance}
                  onChange={e => setCashBalance(e.target.value)}
                  onBlur={saveCashBalance}
                  className="h-7 text-sm"
                  placeholder="0.00"
                  data-testid="input-opening-balance"
                />
                {cashSaving && <Loader2 className="h-3 w-3 animate-spin" />}
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">+ Cash income</span>
                <span>{fmt(stats.cashTotal)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">− Expenses</span>
                <span className="text-orange-600 dark:text-orange-400">-{fmt(stats.expenseTotal)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold border-t pt-1">
                <span>Current</span>
                <span className="text-amber-700 dark:text-amber-400">{fmt(stats.currentCash)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card data-testid="card-expenses-total">
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <MinusCircle className="h-3.5 w-3.5 text-orange-600" />
              <span className="text-[11px] text-muted-foreground font-medium">Expenses</span>
            </div>
            <p className="text-lg font-bold text-orange-600 dark:text-orange-400">{fmt(stats.expenseTotal)}</p>
            <p className="text-[10px] text-muted-foreground">{expenses.length} entries</p>
          </CardContent>
        </Card>
        <Card data-testid="card-net-result">
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
              <span className="text-[11px] text-muted-foreground font-medium">Net Result</span>
            </div>
            <p className={`text-lg font-bold ${stats.netResult >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
              {fmt(stats.netResult)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold">Expenses</h3>
          <Button size="sm" variant="outline" onClick={() => setShowExpenseForm(true)} data-testid="btn-add-expense">
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Expense
          </Button>
        </div>

        {showExpenseForm && (
          <Card className="mb-3">
            <CardContent className="p-3 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Amount ({currency})</Label>
                  <Input type="number" step="0.01" value={expAmount} onChange={e => setExpAmount(e.target.value)} placeholder="0.00" data-testid="input-expense-amount" />
                </div>
                <div>
                  <Label className="text-xs">Date</Label>
                  <Input type="date" value={expDate} onChange={e => setExpDate(e.target.value)} data-testid="input-expense-date" />
                </div>
              </div>
              <div>
                <Label className="text-xs">Category</Label>
                <Select value={expCategory} onValueChange={setExpCategory}>
                  <SelectTrigger data-testid="select-expense-category"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Description</Label>
                <Input value={expDescription} onChange={e => setExpDescription(e.target.value)} placeholder="What was this for?" data-testid="input-expense-description" />
              </div>
              <div>
                <Label className="text-xs">Receipt Photo</Label>
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleReceiptUpload}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingReceipt}
                    data-testid="btn-upload-receipt"
                  >
                    {uploadingReceipt ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Camera className="h-3 w-3 mr-1" />}
                    {expReceiptUrl ? "Replace" : "Upload"}
                  </Button>
                  {expReceiptUrl && (
                    <Badge variant="secondary" className="text-xs">
                      <CheckCircle className="h-3 w-3 mr-1 text-green-600" /> Uploaded
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => createExpenseMutation.mutate()}
                  disabled={!expAmount || !expDate || createExpenseMutation.isPending}
                  data-testid="btn-save-expense"
                >
                  {createExpenseMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                  Save
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowExpenseForm(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {expenses.length === 0 && !showExpenseForm && (
          <p className="text-sm text-muted-foreground text-center py-4">No expenses recorded for this period.</p>
        )}

        {expenses.length > 0 && (
          <div className="space-y-1.5">
            {expenses.map(exp => {
              const cat = EXPENSE_CATEGORIES.find(c => c.value === exp.category);
              const CatIcon = cat?.icon || MoreHorizontal;
              return (
                <div key={exp.id} className="flex items-center gap-2 p-2 rounded-md border bg-card" data-testid={`expense-row-${exp.id}`}>
                  <div className="h-7 w-7 rounded-md bg-muted flex items-center justify-center shrink-0">
                    <CatIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{exp.description || cat?.label || exp.category}</p>
                    <p className="text-[10px] text-muted-foreground">{exp.expenseDate}</p>
                  </div>
                  {exp.receiptUrl && (
                    <button onClick={() => setViewReceiptUrl(exp.receiptUrl)} className="shrink-0" data-testid={`btn-view-receipt-${exp.id}`}>
                      <img src={exp.receiptUrl} alt="Receipt" className="h-8 w-8 rounded object-cover border" />
                    </button>
                  )}
                  <span className="text-sm font-semibold text-orange-600 dark:text-orange-400 shrink-0">
                    -{formatPrice(exp.amount, currency)}
                  </span>
                  <button
                    onClick={() => { if (confirm("Delete this expense?")) deleteExpenseMutation.mutate(exp.id); }}
                    className="shrink-0"
                    data-testid={`btn-delete-expense-${exp.id}`}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-red-600" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-2">Transactions ({filteredBookings.length})</h3>
        {filteredBookings.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">No bookings in this period.</p>
        )}
        <div className="space-y-1.5">
          {filteredBookings.map(b => {
            const pay = PAYMENT_LABELS[b.paymentStatus];
            const PayIcon = pay?.icon || XCircle;
            const isExpanded = expandedBooking === b.id;
            return (
              <div key={b.id} data-testid={`transaction-row-${b.id}`}>
                <button
                  onClick={() => setExpandedBooking(isExpanded ? null : b.id)}
                  className="w-full flex items-center gap-2 p-2 rounded-md border bg-card text-left hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{b.customerName}</p>
                      <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${pay?.color}`}>
                        <PayIcon className="h-2.5 w-2.5 mr-0.5" />{pay?.label}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      {b.bookingDate} · {b.bookingNumber} · {b.items.length} item{b.items.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <span className="text-sm font-semibold shrink-0">{formatPrice(b.totalAmount, currency)}</span>
                  {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
                </button>
                {isExpanded && (
                  <div className="ml-4 mt-1 space-y-0.5 mb-2">
                    {b.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-xs py-0.5 text-muted-foreground">
                        <span className="truncate">{item.quantity}× {item.productName}</span>
                        <span className="shrink-0 ml-2">{formatPrice(item.lineTotal, currency)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {viewReceiptUrl && (
        <Dialog open onOpenChange={() => setViewReceiptUrl(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Receipt</DialogTitle></DialogHeader>
            <img src={viewReceiptUrl} alt="Receipt" className="w-full rounded-md" />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
