import { useState, useMemo, useRef, useEffect, useCallback } from "react";
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
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import type { LucideIcon } from "lucide-react";
import {
  Receipt, Plus, Trash2, Loader2, FileDown, Mail, Search,
  CheckCircle, CreditCard, Banknote, XCircle, ChevronDown, ChevronUp,
  Users, ShoppingCart, AlertTriangle, Store, UserPlus, X, Pencil, ArrowLeft,
  Calendar, GraduationCap, Waves, Package as PackageIcon, Wind, Wrench as WrenchIcon,
  BarChart3, ArrowUpRight, ArrowDownRight, TrendingUp, CircleDot, Navigation, Thermometer,
  Wallet, Fuel, UtensilsCrossed, Truck, HardHat, UserCog, MoreHorizontal, Camera, Eye,
  DollarSign, MinusCircle,
} from "lucide-react";
import type { SchoolCustomer } from "@shared/schema";
import SalesPage from "./sales";
import IncidentsPage from "./incidents";

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
  bookingDate: string;
  paymentStatus: "unpaid" | "cash" | "credit_card";
  totalAmount: string;
  currency: string;
  notes: string | null;
  emailSentAt: string | null;
  createdAt: string;
  createdBy: number | null;
  createdByName: string | null;
  items: BookingItem[];
};

const PAYMENT_LABELS: Record<string, { label: string; color: string; icon: LucideIcon }> = {
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

const CATEGORY_ICON_COMPONENTS: Record<string, LucideIcon> = {
  Course: GraduationCap,
  Lesson: Waves,
  Package: PackageIcon,
  Rental: Wind,
  Other: WrenchIcon,
};

const CATEGORY_TILE_BG: Record<string, string> = {
  Course: "bg-blue-50 border-blue-200 hover:border-blue-400 dark:bg-blue-950/40 dark:border-blue-800",
  Lesson: "bg-green-50 border-green-200 hover:border-green-400 dark:bg-green-950/40 dark:border-green-800",
  Package: "bg-purple-50 border-purple-200 hover:border-purple-400 dark:bg-purple-950/40 dark:border-purple-800",
  Rental: "bg-orange-50 border-orange-200 hover:border-orange-400 dark:bg-orange-950/40 dark:border-orange-800",
  Other: "bg-gray-50 border-gray-200 hover:border-gray-400 dark:bg-gray-900/40 dark:border-gray-700",
};

const KITE_LEVEL_COLORS: Record<string, string> = {
  Beginner: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  Intermediate: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  Advanced: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  Pro: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const COUNTRIES = [
  "Afghanistan","Albania","Algeria","Andorra","Angola","Argentina","Armenia","Australia","Austria","Azerbaijan",
  "Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bhutan","Bolivia",
  "Bosnia and Herzegovina","Botswana","Brazil","Brunei","Bulgaria","Burkina Faso","Burundi",
  "Cambodia","Cameroon","Canada","Cape Verde","Central African Republic","Chad","Chile","China","Colombia",
  "Comoros","Congo","Costa Rica","Croatia","Cuba","Cyprus","Czech Republic",
  "Denmark","Djibouti","Dominica","Dominican Republic",
  "Ecuador","Egypt","El Salvador","Equatorial Guinea","Eritrea","Estonia","Eswatini","Ethiopia",
  "Fiji","Finland","France",
  "Gabon","Gambia","Georgia","Germany","Ghana","Greece","Grenada","Guatemala","Guinea","Guyana",
  "Haiti","Honduras","Hungary",
  "Iceland","India","Indonesia","Iran","Iraq","Ireland","Israel","Italy",
  "Jamaica","Japan","Jordan",
  "Kazakhstan","Kenya","Kuwait","Kyrgyzstan",
  "Laos","Latvia","Lebanon","Lesotho","Liberia","Libya","Liechtenstein","Lithuania","Luxembourg",
  "Madagascar","Malawi","Malaysia","Maldives","Mali","Malta","Mauritania","Mauritius","Mexico","Moldova",
  "Monaco","Mongolia","Montenegro","Morocco","Mozambique","Myanmar",
  "Namibia","Nepal","Netherlands","New Zealand","Nicaragua","Niger","Nigeria","North Macedonia","Norway",
  "Oman",
  "Pakistan","Palestine","Panama","Papua New Guinea","Paraguay","Peru","Philippines","Poland","Portugal",
  "Qatar",
  "Romania","Russia","Rwanda",
  "Saudi Arabia","Senegal","Serbia","Sierra Leone","Singapore","Slovakia","Slovenia","Somalia",
  "South Africa","South Korea","Spain","Sri Lanka","Sudan","Suriname","Sweden","Switzerland","Syria",
  "Taiwan","Tajikistan","Tanzania","Thailand","Togo","Trinidad and Tobago","Tunisia","Turkey","Turkmenistan",
  "Uganda","Ukraine","United Arab Emirates","United Kingdom","United States","Uruguay","Uzbekistan",
  "Venezuela","Vietnam",
  "Yemen",
  "Zambia","Zimbabwe",
];

type TabId = "dashboard" | "bookings" | "customers" | "finance" | "sales" | "incidents";
type BookingSubTab = "new" | "timeline";

function formatPrice(price: string, curr: string) {
  return `${curr} ${parseFloat(price).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function CenterPage() {
  const { user, isAdmin, isStationLead, isSimulating, simStationId } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [bookingSubTab, setBookingSubTab] = useState<BookingSubTab>("new");
  const [selectedSchoolId, setSelectedSchoolId] = useState<number | null>(null);
  const [schoolResolved, setSchoolResolved] = useState(false);

  const { data: schoolConfigs = [], isLoading: configsLoading } = useQuery<SchoolConfig[]>({
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

  if (!isAdmin && !isStationLead) {
    return <div className="p-8 text-center text-muted-foreground" data-testid="text-access-denied">Admin or Center Manager access required.</div>;
  }

  const tabs: { id: TabId; label: string; icon: LucideIcon }[] = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "bookings", label: "Bookings", icon: Receipt },
    { id: "customers", label: "Customers", icon: Users },
    { id: "finance", label: "Finance", icon: Wallet },
    { id: "sales", label: "Sales", icon: ShoppingCart },
    { id: "incidents", label: "Incidents", icon: AlertTriangle },
  ];

  return (
    <div className="flex flex-col h-full" data-testid="center-page">
      <div className="bg-background border-b px-4 pt-3 pb-0 sticky top-0 z-30">
        <div className="flex items-center gap-3 mb-3">
          <Store className="h-5 w-5 text-primary shrink-0" />
          {isAdmin && !isStationLead ? (
            <Select
              value={selectedSchoolId ? String(selectedSchoolId) : "__none__"}
              onValueChange={v => setSelectedSchoolId(v === "__none__" ? null : parseInt(v))}
            >
              <SelectTrigger className="h-8 w-52 text-sm" data-testid="select-school">
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
              <p className="text-sm font-semibold" data-testid="text-school-name">{selectedConfig?.schoolName ?? "Loading..."}</p>
              <p className="text-[11px] text-muted-foreground">{selectedConfig?.stationName}</p>
            </div>
          )}
        </div>
        <div className="flex gap-1 -mb-px overflow-x-auto" data-testid="center-tabs">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                data-testid={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  active
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === "customers" && selectedSchoolId && selectedConfig && (
          <CustomersTab schoolConfigId={selectedSchoolId} currency={selectedConfig.currency} />
        )}
        {activeTab === "customers" && !selectedSchoolId && (
          <div className="p-8 text-center text-muted-foreground">Select a school to manage customers.</div>
        )}
        {activeTab === "bookings" && selectedSchoolId && selectedConfig && (
          <BookingsTab
            schoolConfigId={selectedSchoolId}
            currency={selectedConfig.currency}
            subTab={bookingSubTab}
            onSubTabChange={setBookingSubTab}
          />
        )}
        {activeTab === "bookings" && !selectedSchoolId && (
          <div className="p-8 text-center text-muted-foreground">
            {configsLoading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : "Select a school to manage bookings."}
          </div>
        )}
        {activeTab === "dashboard" && selectedSchoolId && selectedConfig && (
          <ForecastTab schoolConfigId={selectedSchoolId} currency={selectedConfig.currency} stationName={selectedConfig.stationName} />
        )}
        {activeTab === "dashboard" && !selectedSchoolId && (
          <div className="p-8 text-center text-muted-foreground">Select a school to view forecast.</div>
        )}
        {activeTab === "finance" && selectedSchoolId && selectedConfig && (
          <FinanceTab schoolConfigId={selectedSchoolId} currency={selectedConfig.currency} />
        )}
        {activeTab === "finance" && !selectedSchoolId && (
          <div className="p-8 text-center text-muted-foreground">Select a school to view finances.</div>
        )}
        {activeTab === "sales" && <SalesPage />}
        {activeTab === "incidents" && <IncidentsPage />}
      </div>
    </div>
  );
}

function BookingsTab({
  schoolConfigId, currency, subTab, onSubTabChange,
}: {
  schoolConfigId: number;
  currency: string;
  subTab: BookingSubTab;
  onSubTabChange: (t: BookingSubTab) => void;
}) {
  return (
    <div>
      <div className="flex gap-1 px-4 pt-3 pb-2 bg-muted/30 border-b">
        {([
          { id: "new" as const, label: "New Booking" },
          { id: "timeline" as const, label: "Timeline" },
        ]).map(t => (
          <button
            key={t.id}
            data-testid={`subtab-${t.id}`}
            onClick={() => onSubTabChange(t.id)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              subTab === t.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {subTab === "new" && (
        <NewBookingView
          schoolConfigId={schoolConfigId}
          currency={currency}
          onCreated={() => onSubTabChange("timeline")}
        />
      )}
      {subTab === "timeline" && (
        <BookingTimeline schoolConfigId={schoolConfigId} currency={currency} />
      )}
    </div>
  );
}

function CustomerAutocomplete({
  schoolConfigId,
  selectedCustomerId,
  customerName,
  customerEmail,
  onSelect,
  onClear,
}: {
  schoolConfigId: number;
  selectedCustomerId: number | null;
  customerName: string;
  customerEmail: string;
  onSelect: (id: number | null, name: string, email: string) => void;
  onClear: () => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: customers = [] } = useQuery<SchoolCustomer[]>({
    queryKey: ["/api/school-customers", schoolConfigId],
    enabled: !!schoolConfigId,
  });

  const filtered = useMemo(() => {
    if (!query.trim()) return customers.slice(0, 8);
    const q = query.toLowerCase();
    return customers.filter(c =>
      `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [customers, query]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (open && query.trim().length >= 2 && filtered.length === 0 && !showCreateDialog) {
      const timeout = setTimeout(() => {
        setShowCreateDialog(true);
        setOpen(false);
      }, 600);
      return () => clearTimeout(timeout);
    }
  }, [open, query, filtered.length, showCreateDialog]);

  if (selectedCustomerId) {
    return (
      <div className="flex items-center gap-2 border rounded-lg px-3 py-2 bg-muted/30">
        <Users className="h-4 w-4 text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate" data-testid="text-selected-customer">{customerName}</p>
          {customerEmail && <p className="text-[11px] text-muted-foreground truncate">{customerEmail}</p>}
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={onClear} data-testid="btn-clear-customer">
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          data-testid="input-customer-search"
          className="pl-9"
          placeholder="Search customer..."
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
        />
      </div>
      {open && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {filtered.length > 0 ? (
            filtered.map(c => (
              <button
                key={c.id}
                data-testid={`customer-option-${c.id}`}
                className="w-full text-left px-3 py-2 hover:bg-muted transition-colors flex items-center gap-2"
                onClick={() => {
                  onSelect(c.id, `${c.firstName} ${c.lastName}`, c.email);
                  setQuery("");
                  setOpen(false);
                }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{c.firstName} {c.lastName}</p>
                  <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                </div>
                <Badge className={`text-[10px] shrink-0 ${KITE_LEVEL_COLORS[c.kiteLevel] || ""}`}>
                  {c.kiteLevel}
                </Badge>
              </button>
            ))
          ) : (
            <div>
              <p className="text-sm text-muted-foreground px-3 py-3 text-center">No customer found</p>
              <div className="border-t">
                <button
                  data-testid="btn-create-new-customer"
                  className="w-full text-left px-3 py-2.5 hover:bg-muted transition-colors flex items-center gap-2 text-primary font-medium"
                  onClick={() => { setShowCreateDialog(true); setOpen(false); }}
                >
                  <UserPlus className="h-4 w-4" />
                  <span className="text-sm">Create new customer</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {showCreateDialog && (
        <CreateCustomerDialog
          schoolConfigId={schoolConfigId}
          initialFirstName={query.trim()}
          onCreated={(c) => {
            onSelect(c.id, `${c.firstName} ${c.lastName}`, c.email);
            setShowCreateDialog(false);
            setQuery("");
          }}
          onClose={() => setShowCreateDialog(false)}
        />
      )}
    </div>
  );
}

function CreateCustomerDialog({
  schoolConfigId, onCreated, onClose, initialFirstName = "",
}: {
  schoolConfigId: number;
  onCreated: (c: SchoolCustomer) => void;
  onClose: () => void;
  initialFirstName?: string;
}) {
  const { toast } = useToast();
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [nationality, setNationality] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [guestType, setGuestType] = useState<"KiteWorldWide" | "Walk-in">("Walk-in");
  const [kiteLevel, setKiteLevel] = useState("Beginner");
  const [weightKg, setWeightKg] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [arrivalDate, setArrivalDate] = useState(new Date().toISOString().slice(0, 10));
  const [departureDate, setDepartureDate] = useState("");
  const [notes, setNotes] = useState("");

  const createMutation = useMutation({
    mutationFn: (data: object) => apiRequest("POST", "/api/school-customers", data).then(r => r.json()),
    onSuccess: (created: SchoolCustomer) => {
      queryClient.invalidateQueries({ queryKey: ["/api/school-customers", schoolConfigId] });
      toast({ title: "Customer created" });
      onCreated(created);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const isValid = firstName.trim() && lastName.trim() && email.trim() && phone.trim() &&
    nationality && dateOfBirth && emergencyContact.trim() && arrivalDate && departureDate;

  function handleSubmit() {
    createMutation.mutate({
      schoolConfigId,
      guestType,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      nationality,
      dateOfBirth,
      kiteLevel,
      weightKg: weightKg ? parseInt(weightKg) : null,
      emergencyContact: emergencyContact.trim(),
      arrivalDate,
      departureDate,
      notes: notes.trim() || null,
    });
  }

  return (
    <Dialog open onOpenChange={o => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" /> Create New Customer
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Guest Type</p>
            <div className="flex gap-2">
              {(["KiteWorldWide", "Walk-in"] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  data-testid={`btn-guest-type-${t}`}
                  onClick={() => setGuestType(t)}
                  className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                    guestType === t
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-border text-muted-foreground hover:bg-accent/50"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">First Name *</Label>
              <Input data-testid="input-new-first-name" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Sophie" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Last Name *</Label>
              <Input data-testid="input-new-last-name" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Müller" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Email *</Label>
              <Input data-testid="input-new-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="guest@email.com" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Phone *</Label>
              <Input data-testid="input-new-phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+49 170 1234567" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Nationality *</Label>
              <Select value={nationality} onValueChange={setNationality}>
                <SelectTrigger data-testid="select-new-nationality"><SelectValue placeholder="Select country" /></SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Date of Birth *</Label>
              <Input data-testid="input-new-dob" type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Kite Level *</Label>
              <Select value={kiteLevel} onValueChange={setKiteLevel}>
                <SelectTrigger data-testid="select-new-kite-level"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                  <SelectItem value="Pro">Pro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Weight (kg)</Label>
              <Input data-testid="input-new-weight" type="number" min="30" max="200" value={weightKg} onChange={e => setWeightKg(e.target.value)} placeholder="75" />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Emergency Contact *</Label>
            <Input data-testid="input-new-emergency" value={emergencyContact} onChange={e => setEmergencyContact(e.target.value)} placeholder="Hans Müller +49 170 9876543" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Arrival *</Label>
              <Input data-testid="input-new-arrival" type="date" value={arrivalDate} onChange={e => setArrivalDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Departure *</Label>
              <Input data-testid="input-new-departure" type="date" value={departureDate} onChange={e => setDepartureDate(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Notes</Label>
            <Textarea data-testid="input-new-notes" rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional..." />
          </div>
        </div>
        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button data-testid="btn-submit-new-customer" disabled={!isValid || createMutation.isPending} onClick={handleSubmit}>
            {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type ProductGroup = {
  header: string;
  products: { product: SchoolProduct; variantLabel: string | null }[];
};

function ProductTiles({
  products, currency, selectedIds, onAdd,
}: {
  products: SchoolProduct[];
  currency: string;
  selectedIds: Set<number>;
  onAdd: (p: SchoolProduct) => void;
}) {
  const grouped = useMemo(() => {
    const byCategory: Record<string, SchoolProduct[]> = {};
    for (const p of products) {
      if (selectedIds.has(p.id)) continue;
      if (!byCategory[p.category]) byCategory[p.category] = [];
      byCategory[p.category].push(p);
    }

    const result: { category: string; groups: ProductGroup[] }[] = [];
    for (const [category, catProducts] of Object.entries(byCategory).sort(([a], [b]) => a.localeCompare(b))) {
      const groupMap: Record<string, { product: SchoolProduct; variantLabel: string | null }[]> = {};
      const ungrouped: { product: SchoolProduct; variantLabel: string | null }[] = [];

      for (const p of catProducts) {
        const dashMatch = p.name.match(/^(.+?)\s[–\-]\s(.+)$/);
        if (dashMatch) {
          const base = dashMatch[1].trim();
          const variant = dashMatch[2].trim();
          if (!groupMap[base]) groupMap[base] = [];
          groupMap[base].push({ product: p, variantLabel: variant });
        } else {
          ungrouped.push({ product: p, variantLabel: null });
        }
      }

      const groups: ProductGroup[] = [];
      for (const [header, items] of Object.entries(groupMap)) {
        if (items.length >= 2) {
          groups.push({ header, products: items });
        } else {
          ungrouped.push(...items.map(i => ({ product: i.product, variantLabel: null })));
        }
      }
      if (ungrouped.length > 0) {
        groups.push({ header: "", products: ungrouped });
      }
      result.push({ category, groups });
    }
    return result;
  }, [products, selectedIds]);

  if (grouped.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-6">All products have been added</p>;
  }

  const tileBg = (cat: string) => CATEGORY_TILE_BG[cat] || CATEGORY_TILE_BG.Other;

  return (
    <div className="space-y-5">
      {grouped.map(({ category, groups }) => {
        const Icon = CATEGORY_ICON_COMPONENTS[category] || WrenchIcon;
        return (
          <div key={category}>
            <div className="flex items-center gap-1.5 mb-2">
              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{category}</p>
            </div>
            <div className="space-y-3">
              {groups.map((group) => {
                if (group.header) {
                  return (
                    <div key={group.header}>
                      <p className="text-xs font-semibold mb-1.5 pl-0.5">{group.header}</p>
                      <div className="grid grid-cols-3 gap-1.5">
                        {group.products.map(({ product, variantLabel }) => (
                          <button
                            key={product.id}
                            data-testid={`product-tile-${product.id}`}
                            onClick={() => onAdd(product)}
                            className={`text-left border rounded-lg px-2 py-1.5 transition-all active:scale-[0.97] ${tileBg(category)}`}
                          >
                            <p className="text-[11px] font-medium leading-tight truncate">{variantLabel}</p>
                            <p className="text-[11px] font-bold text-primary">{currency} {parseFloat(product.defaultPrice).toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                }
                return (
                  <div key="ungrouped" className="grid grid-cols-3 gap-1.5">
                    {group.products.map(({ product }) => (
                      <button
                        key={product.id}
                        data-testid={`product-tile-${product.id}`}
                        onClick={() => onAdd(product)}
                        className={`text-left border rounded-lg px-2 py-1.5 transition-all active:scale-[0.97] ${tileBg(category)}`}
                      >
                        <p className="text-[11px] font-medium leading-tight line-clamp-2">{product.name}</p>
                        <p className="text-[11px] font-bold text-primary mt-0.5">{currency} {parseFloat(product.defaultPrice).toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function NewBookingView({
  schoolConfigId, currency, onCreated,
}: {
  schoolConfigId: number;
  currency: string;
  onCreated: () => void;
}) {
  const { toast } = useToast();

  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentStatus, setPaymentStatus] = useState("unpaid");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<{ productId: number | null; productName: string; category: string; quantity: number; unitPrice: string }[]>([]);
  const [showProducts, setShowProducts] = useState(false);
  const [showCustomItem, setShowCustomItem] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customPrice, setCustomPrice] = useState("");

  const { data: products = [] } = useQuery<SchoolProduct[]>({
    queryKey: ["/api/school-products", schoolConfigId],
    enabled: !!schoolConfigId,
  });

  const { data: nextNum } = useQuery<{ bookingNumber: string }>({
    queryKey: ["/api/school-bookings/next-number", schoolConfigId],
    staleTime: 0,
  });

  const activeProducts = products.filter(p => p.isActive);
  const selectedProductIds = useMemo(() => new Set(items.filter(i => i.productId).map(i => i.productId!)), [items]);

  function addProduct(p: SchoolProduct) {
    setItems(prev => [...prev, {
      productId: p.id,
      productName: p.name,
      category: p.category,
      quantity: 1,
      unitPrice: p.defaultPrice,
    }]);
  }

  function addCustomItem() {
    if (!customName.trim() || !customPrice.trim()) return;
    setItems(prev => [...prev, {
      productId: null,
      productName: customName.trim(),
      category: "Other",
      quantity: 1,
      unitPrice: customPrice,
    }]);
    setCustomName("");
    setCustomPrice("");
    setShowCustomItem(false);
  }

  function removeItem(idx: number) {
    setItems(prev => prev.filter((_, i) => i !== idx));
  }

  function updateItem(idx: number, field: string, value: string | number) {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  }

  const totalAmount = items.reduce((sum, i) => sum + (parseFloat(i.unitPrice) || 0) * i.quantity, 0);

  const createMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/school-bookings", {
        schoolConfigId,
        customerId: selectedCustomerId,
        customerName,
        customerEmail: customerEmail || null,
        bookingDate,
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
      queryClient.invalidateQueries({ queryKey: ["/api/school-bookings", schoolConfigId] });
      setSelectedCustomerId(null);
      setCustomerName("");
      setCustomerEmail("");
      setBookingDate(new Date().toISOString().slice(0, 10));
      setPaymentStatus("unpaid");
      setNotes("");
      setItems([]);
      onCreated();
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const canSubmit = selectedCustomerId && customerName.trim() && items.length > 0 && items.every(i => parseFloat(i.unitPrice) > 0);

  if (showProducts) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowProducts(false)} data-testid="btn-back-from-products">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <h2 className="text-base font-semibold">Add Product</h2>
        </div>
        <ProductTiles
          products={activeProducts}
          currency={currency}
          selectedIds={selectedProductIds}
          onAdd={(p) => { addProduct(p); setShowProducts(false); }}
        />
        <div className="border-t pt-4">
          {!showCustomItem ? (
            <Button variant="outline" className="w-full" onClick={() => setShowCustomItem(true)} data-testid="btn-show-custom-item">
              <Plus className="h-4 w-4 mr-1" /> Custom Item
            </Button>
          ) : (
            <div className="space-y-2 border rounded-lg p-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Custom Item</p>
              <Input
                data-testid="input-custom-name"
                placeholder="Description"
                value={customName}
                onChange={e => setCustomName(e.target.value)}
              />
              <Input
                data-testid="input-custom-price"
                type="number"
                step="0.01"
                min="0"
                placeholder={`Price (${currency})`}
                value={customPrice}
                onChange={e => setCustomPrice(e.target.value)}
              />
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => setShowCustomItem(false)}>Cancel</Button>
                <Button
                  size="sm"
                  className="flex-1"
                  disabled={!customName.trim() || !customPrice.trim()}
                  onClick={() => { addCustomItem(); setShowProducts(false); }}
                  data-testid="btn-add-custom-item"
                >
                  Add
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-2xl md:max-w-3xl mx-auto pb-24">
      {nextNum && (
        <div className="flex items-center gap-2">
          <Receipt className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-mono text-muted-foreground" data-testid="text-next-booking-number">{nextNum.bookingNumber}</span>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Customer</p>
        <CustomerAutocomplete
          schoolConfigId={schoolConfigId}
          selectedCustomerId={selectedCustomerId}
          customerName={customerName}
          customerEmail={customerEmail}
          onSelect={(id, name, email) => {
            setSelectedCustomerId(id);
            setCustomerName(name);
            setCustomerEmail(email);
          }}
          onClear={() => {
            setSelectedCustomerId(null);
            setCustomerName("");
            setCustomerEmail("");
          }}
        />
        {!selectedCustomerId && (
          <p className="text-xs text-muted-foreground">Search for an existing customer or create a new one.</p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Products</p>
          <Button variant="outline" size="sm" onClick={() => setShowProducts(true)} data-testid="btn-open-product-picker">
            <Plus className="h-3 w-3 mr-1" /> Add
          </Button>
        </div>

        {items.length === 0 ? (
          <div
            className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
            onClick={() => setShowProducts(true)}
            data-testid="empty-items-placeholder"
          >
            <Plus className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
            <p className="text-sm text-muted-foreground">Add a product</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div key={idx} className="border rounded-xl p-3" data-testid={`booking-item-${idx}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{item.productName}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${CATEGORY_COLORS[item.category] || ""}`}>{item.category}</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0" onClick={() => removeItem(idx)} data-testid={`btn-remove-item-${idx}`}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="space-y-0.5">
                    <Label className="text-[10px]">Qty</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={e => updateItem(idx, "quantity", parseInt(e.target.value) || 1)}
                      className="h-8 text-xs"
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
                      className="h-8 text-xs"
                      data-testid={`input-item-price-${idx}`}
                    />
                  </div>
                </div>
                <p className="text-xs text-right font-mono mt-1 text-muted-foreground">
                  = {currency} {((parseFloat(item.unitPrice) || 0) * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Date</Label>
          <Input
            type="date"
            value={bookingDate}
            onChange={e => setBookingDate(e.target.value)}
            data-testid="input-booking-date"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Payment</Label>
          <Select value={paymentStatus} onValueChange={setPaymentStatus}>
            <SelectTrigger className="h-9" data-testid="select-payment-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unpaid">Unpaid</SelectItem>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="credit_card">Card</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Notes</Label>
        <Textarea
          placeholder="Optional notes..."
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={2}
          data-testid="input-booking-notes"
        />
      </div>

      {items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 md:static md:mt-4 bg-background border-t md:border md:rounded-xl p-4 z-40 shadow-lg md:shadow-none">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-semibold">Total</span>
            <span className="font-bold text-xl" data-testid="text-booking-total">
              {currency} {totalAmount.toFixed(2)}
            </span>
          </div>
          <Button
            className="w-full h-12 text-base"
            onClick={() => createMutation.mutate()}
            disabled={!canSubmit || createMutation.isPending}
            data-testid="btn-submit-booking"
          >
            {createMutation.isPending && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
            Create Booking
          </Button>
        </div>
      )}
    </div>
  );
}

function parseDurationDays(productName: string): number {
  const lower = productName.toLowerCase();
  const weekMatch = lower.match(/(\d+)\s*week/);
  if (weekMatch) return parseInt(weekMatch[1]) * 7;
  const dayMatch = lower.match(/(\d+)\s*day/);
  if (dayMatch) return parseInt(dayMatch[1]);
  const hourMatch = lower.match(/(\d+)\s*hour/);
  if (hourMatch) return 1;
  if (lower.includes("additional day")) return 1;
  return 1;
}

function addDays(date: string, days: number): string {
  const d = new Date(date + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function BookingTimeline({
  schoolConfigId, currency,
}: {
  schoolConfigId: number;
  currency: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: bookings = [], isLoading } = useQuery<Booking[]>({
    queryKey: ["/api/school-bookings", schoolConfigId],
  });

  const { today, startDate, endDate } = useMemo(() => {
    const now = new Date();
    const t = now.toISOString().slice(0, 10);
    return { today: t, startDate: addDays(t, -3), endDate: addDays(t, 10) };
  }, []);

  const days = useMemo(() => {
    const result: string[] = [];
    let d = startDate;
    let safety = 0;
    while (d <= endDate && safety < 30) {
      result.push(d);
      d = addDays(d, 1);
      safety++;
    }
    return result;
  }, [startDate, endDate]);

  type TimelineItem = {
    bookingId: number;
    bookingNumber: string;
    customerName: string;
    productName: string;
    category: string;
    startDate: string;
    endDate: string;
    quantity: number;
    unitPrice: string;
  };

  const { courseItems, rentalItems } = useMemo(() => {
    const courses: TimelineItem[] = [];
    const rentals: TimelineItem[] = [];

    for (const b of bookings) {
      if (!b.bookingDate) continue;
      for (const item of b.items) {
        const cat = item.category;
        if (cat !== "Course" && cat !== "Lesson" && cat !== "Rental") continue;

        const durationDays = parseDurationDays(item.productName);
        const itemStart = b.bookingDate;
        const itemEnd = addDays(itemStart, durationDays - 1);

        if (itemEnd < startDate || itemStart > endDate) continue;

        const entry: TimelineItem = {
          bookingId: b.id,
          bookingNumber: b.bookingNumber,
          customerName: b.customerName,
          productName: item.productName,
          category: cat,
          startDate: itemStart,
          endDate: itemEnd,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        };

        if (cat === "Rental") {
          rentals.push(entry);
        } else {
          courses.push(entry);
        }
      }
    }

    courses.sort((a, b) => a.startDate.localeCompare(b.startDate) || a.customerName.localeCompare(b.customerName));
    rentals.sort((a, b) => a.startDate.localeCompare(b.startDate) || a.customerName.localeCompare(b.customerName));

    return { courseItems: courses, rentalItems: rentals };
  }, [bookings, startDate, endDate]);

  useEffect(() => {
    if (scrollRef.current) {
      const todayIdx = days.indexOf(today);
      if (todayIdx >= 0) {
        const colWidth = 80;
        scrollRef.current.scrollLeft = Math.max(0, (todayIdx - 1) * colWidth);
      }
    }
  }, [days, today]);

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-3">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const DAY_W = 80;
  const LABEL_W = 160;

  function formatDay(d: string) {
    const date = new Date(d + "T12:00:00Z");
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return {
      weekday: dayNames[date.getUTCDay()],
      day: date.getUTCDate(),
      month: date.getUTCMonth() + 1,
    };
  }

  function renderSection(title: string, items: TimelineItem[], barColor: string, bgColor: string) {
    return (
      <div className="mb-6" data-testid={`timeline-section-${title.toLowerCase()}`}>
        <div className="flex items-center gap-2 px-4 mb-2">
          {title === "Courses" ? <GraduationCap className="h-4 w-4 text-blue-600" /> : <Wind className="h-4 w-4 text-orange-600" />}
          <h3 className="text-sm font-semibold">{title}</h3>
          <Badge variant="secondary" className="text-[10px]">{items.length}</Badge>
        </div>

        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground px-4 py-3">No bookings in this period</p>
        ) : (
          <div className="border rounded-lg overflow-hidden mx-2">
            <div className="overflow-x-auto" ref={title === "Courses" ? scrollRef : undefined}>
              <div style={{ minWidth: LABEL_W + days.length * DAY_W }}>
                <div className="flex border-b bg-muted/50 sticky top-0 z-10">
                  <div className="shrink-0 border-r bg-background sticky left-0 z-20 px-2 py-1.5 flex items-center" style={{ width: LABEL_W }}>
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase">Customer / Product</span>
                  </div>
                  {days.map(d => {
                    const { weekday, day, month } = formatDay(d);
                    const isToday = d === today;
                    const isWeekend = new Date(d + "T12:00:00Z").getUTCDay() % 6 === 0;
                    return (
                      <div
                        key={d}
                        className={`shrink-0 text-center border-r py-1 ${isToday ? "bg-primary/10 font-bold" : isWeekend ? "bg-muted/60" : ""}`}
                        style={{ width: DAY_W }}
                      >
                        <p className={`text-[10px] ${isToday ? "text-primary" : "text-muted-foreground"}`}>{weekday}</p>
                        <p className={`text-xs font-medium ${isToday ? "text-primary" : ""}`}>{day}.{month}.</p>
                      </div>
                    );
                  })}
                </div>

                {items.map((item, idx) => (
                  <div key={`${item.bookingId}-${idx}`} className="flex border-b last:border-b-0 hover:bg-muted/20" data-testid={`timeline-row-${item.bookingId}-${idx}`}>
                    <div className="shrink-0 border-r bg-background sticky left-0 z-10 px-2 py-1.5" style={{ width: LABEL_W }}>
                      <p className="text-[11px] font-medium truncate">{item.customerName}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{item.productName}</p>
                      {item.quantity > 1 && <span className="text-[9px] text-muted-foreground">×{item.quantity}</span>}
                    </div>
                    {days.map(d => {
                      const inRange = d >= item.startDate && d <= item.endDate;
                      const isStart = d === item.startDate;
                      const isEnd = d === item.endDate;
                      const isToday = d === today;
                      const isWeekend = new Date(d + "T12:00:00Z").getUTCDay() % 6 === 0;
                      return (
                        <div
                          key={d}
                          className={`shrink-0 border-r relative ${isToday && !inRange ? "bg-primary/5" : isWeekend && !inRange ? "bg-muted/30" : ""}`}
                          style={{ width: DAY_W, height: 44 }}
                        >
                          {inRange && (
                            <div
                              className={`absolute top-1.5 bottom-1.5 ${barColor} ${isStart && isEnd ? "left-1 right-1 rounded" : isStart ? "left-1 right-0 rounded-l" : isEnd ? "left-0 right-1 rounded-r" : "left-0 right-0"}`}
                            >
                              {isStart && (
                                <span className="text-[9px] text-white font-medium px-1.5 truncate block leading-[28px]">
                                  {item.quantity > 1 ? `${item.quantity}×` : ""}{currency} {parseFloat(item.unitPrice).toFixed(0)}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="py-4" data-testid="booking-timeline">
      <div className="px-4 mb-4">
        <p className="text-xs text-muted-foreground">
          {new Date(startDate + "T12:00:00Z").toLocaleDateString("en-US", { day: "numeric", month: "short" })} – {new Date(endDate + "T12:00:00Z").toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
        </p>
      </div>
      {renderSection("Courses", courseItems, "bg-blue-500", "bg-blue-50")}
      {renderSection("Rental", rentalItems, "bg-orange-500", "bg-orange-50")}
    </div>
  );
}

type ForecastDetail = "courses" | "rentals" | "guests" | "arrivals" | "departures" | "unpaid" | null;

const STATION_COORDS: Record<string, { lat: number; lon: number; label: string; timezone: string }> = {
  dakhla:   { lat: 23.72,  lon: -15.93, label: "Dakhla",   timezone: "Africa/Casablanca" },
  tatajuba: { lat: -2.77,  lon: -40.39, label: "Tatajuba", timezone: "America/Fortaleza" },
  hamburg:  { lat: 53.55,  lon:   9.99, label: "Hamburg",  timezone: "Europe/Berlin" },
  heidenau: { lat: 53.47,  lon:  10.11, label: "Heidenau", timezone: "Europe/Berlin" },
};

function getStationCoords(name: string) {
  const lower = name.toLowerCase();
  for (const [key, val] of Object.entries(STATION_COORDS)) {
    if (lower.includes(key)) return val;
  }
  return null;
}

function degToCompass(deg: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(deg / 45) % 8];
}

function kiteRating(knots: number): { label: string; color: string } {
  if (knots < 8)  return { label: "Too light", color: "text-muted-foreground" };
  if (knots < 12) return { label: "Light", color: "text-yellow-600 dark:text-yellow-400" };
  if (knots < 20) return { label: "Good", color: "text-emerald-600 dark:text-emerald-400" };
  if (knots < 30) return { label: "Strong", color: "text-blue-600 dark:text-blue-400" };
  return { label: "Storm", color: "text-red-600 dark:text-red-400" };
}

function windBarColor(knots: number): string {
  if (knots < 8)  return "bg-slate-300 dark:bg-slate-600";
  if (knots < 12) return "bg-yellow-400 dark:bg-yellow-500";
  if (knots < 20) return "bg-emerald-500 dark:bg-emerald-400";
  if (knots < 28) return "bg-blue-500 dark:bg-blue-400";
  return "bg-red-500 dark:bg-red-400";
}

function windTextColor(knots: number): string {
  if (knots < 8)  return "text-slate-400 dark:text-slate-500";
  if (knots < 12) return "text-yellow-600 dark:text-yellow-400";
  if (knots < 20) return "text-emerald-600 dark:text-emerald-400";
  if (knots < 28) return "text-blue-600 dark:text-blue-400";
  return "text-red-600 dark:text-red-400";
}

type CenterWeatherData = {
  current: {
    time: string;
    temperature_2m: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    weather_code: number;
  };
  hourly: {
    time: string[];
    wind_speed_10m: number[];
    wind_direction_10m: number[];
    temperature_2m: number[];
    weather_code: number[];
  };
  daily: {
    time: string[];
    sunrise: string[];
    sunset: string[];
  };
};

function CenterWindBarCard({
  time, wind, direction, temp, isCurrent, isNow,
}: {
  time: string; wind: number; direction: number; temp: number; isCurrent: boolean; isNow: boolean;
}) {
  const maxBar = 35;
  const barHeightPct = Math.min(100, (wind / maxBar) * 100);
  const hour = new Date(time).getHours();
  const label = `${String(hour).padStart(2, "0")}h`;
  const dir = degToCompass(direction);

  return (
    <div className="flex flex-col items-center gap-0.5 min-w-[36px]">
      <span className={`text-[9px] font-medium leading-tight ${isNow ? "text-sky-600 dark:text-sky-400 font-bold" : "text-muted-foreground"}`}>
        {isNow ? "Now" : label}
      </span>
      <div className={`text-[8px] font-medium leading-tight ${windTextColor(wind)}`}>{dir}</div>
      <div className="relative h-14 w-5 flex items-end justify-center">
        <div
          className={`w-4 rounded-t-sm transition-all ${windBarColor(wind)} ${isCurrent ? "ring-1 ring-offset-1 ring-sky-400" : ""}`}
          style={{ height: `${Math.max(10, barHeightPct)}%` }}
        />
      </div>
      <span className={`text-[10px] font-bold tabular-nums leading-tight ${windTextColor(wind)}`}>{Math.round(wind)}</span>
      <span className="text-[8px] text-muted-foreground leading-tight">{Math.round(temp)}°</span>
    </div>
  );
}

function WindForecastWidget({ stationName }: { stationName: string }) {
  const coords = getStationCoords(stationName);
  const [activeDay, setActiveDay] = useState<0 | 1>(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const nowCardRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isError } = useQuery<CenterWeatherData>({
    queryKey: ["center-weather", coords?.lat, coords?.lon],
    queryFn: async () => {
      if (!coords) throw new Error("No coords");
      const url = [
        `https://api.open-meteo.com/v1/forecast`,
        `?latitude=${coords.lat}&longitude=${coords.lon}`,
        `&current=temperature_2m,wind_speed_10m,wind_direction_10m,weather_code`,
        `&hourly=wind_speed_10m,wind_direction_10m,temperature_2m,weather_code`,
        `&daily=sunrise,sunset`,
        `&wind_speed_unit=kn`,
        `&timezone=${encodeURIComponent(coords.timezone)}`,
        `&forecast_days=2`,
      ].join("");
      const res = await fetch(url);
      if (!res.ok) throw new Error("Weather fetch failed");
      return res.json();
    },
    enabled: !!coords,
    staleTime: 15 * 60 * 1000,
    retry: 1,
  });

  useEffect(() => {
    if (activeDay === 0 && nowCardRef.current && scrollRef.current) {
      setTimeout(() => {
        nowCardRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }, 100);
    } else if (scrollRef.current) {
      scrollRef.current.scrollLeft = 0;
    }
  }, [activeDay, data]);

  if (!coords) return null;
  if (isLoading) return <Skeleton className="h-44 w-full rounded-xl" />;
  if (isError || !data) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-4 text-center text-xs text-muted-foreground">
          Weather data unavailable
        </CardContent>
      </Card>
    );
  }

  const currentWind = Math.round(data.current.wind_speed_10m);
  const currentDir = degToCompass(data.current.wind_direction_10m);
  const currentTemp = Math.round(data.current.temperature_2m);
  const currentRating = kiteRating(currentWind);
  const nowTime = data.current.time;

  const sunrise = data.daily.sunrise[activeDay];
  const sunset = data.daily.sunset[activeDay];

  const sunriseDate = new Date(sunrise);
  const sunsetDate = new Date(sunset);

  const fmt = (iso: string) => {
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  const dayHours = data.hourly.time
    .map((t, i) => ({
      time: t,
      wind: data.hourly.wind_speed_10m[i],
      direction: data.hourly.wind_direction_10m[i],
      temp: data.hourly.temperature_2m[i],
    }))
    .filter(({ time }) => {
      const d = new Date(time);
      return d >= sunriseDate && d <= sunsetDate;
    });

  const nowHourStr = nowTime.substring(0, 13);
  const nowHourNum = parseInt(nowHourStr.substring(11, 13), 10);
  const nowIdx = activeDay === 0
    ? dayHours.reduce((best, h, i) => {
        const hNum = parseInt(h.time.substring(11, 13), 10);
        const bestNum = best >= 0 ? parseInt(dayHours[best].time.substring(11, 13), 10) : 99;
        return Math.abs(hNum - nowHourNum) < Math.abs(bestNum - nowHourNum) ? i : best;
      }, -1)
    : -1;

  const peakHour = [...dayHours].sort((a, b) => b.wind - a.wind)[0];
  const goodHours = dayHours.filter(h => h.wind >= 12 && h.wind < 28);

  return (
    <Card className="border-sky-200 dark:border-sky-800 overflow-hidden" data-testid="wind-forecast-card">
      <CardContent className="p-0">
        <div className="flex items-center border-b border-border px-3 py-2 gap-2">
          <Wind className="h-3 w-3 text-sky-500 shrink-0" />
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide shrink-0">
            {coords.label}
          </span>
          {activeDay === 0 ? (
            <div className="flex items-center gap-1.5 ml-1 min-w-0">
              <span className={`text-xs font-bold tabular-nums ${windTextColor(currentWind)}`} data-testid="text-current-wind">
                {currentWind} kn
              </span>
              <Navigation
                className="h-3 w-3 text-sky-500 shrink-0"
                style={{ transform: `rotate(${data.current.wind_direction_10m}deg)` }}
              />
              <span className="text-[10px] font-semibold text-sky-600 dark:text-sky-400">{currentDir}</span>
              <Thermometer className="h-3 w-3 text-orange-400" />
              <span className="text-[10px] font-medium">{currentTemp}°</span>
              <span className={`text-[10px] font-semibold ${currentRating.color}`} data-testid="text-kite-rating">
                · {currentRating.label}
              </span>
            </div>
          ) : peakHour ? (
            <div className="flex items-center gap-1.5 ml-1 min-w-0">
              <span className="text-[9px] text-muted-foreground shrink-0">peak</span>
              <span className={`text-xs font-bold tabular-nums ${windTextColor(Math.round(peakHour.wind))}`}>
                {Math.round(peakHour.wind)} kn
              </span>
              <Navigation
                className="h-3 w-3 text-sky-500 shrink-0"
                style={{ transform: `rotate(${peakHour.direction}deg)` }}
              />
              <span className="text-[10px] font-semibold text-sky-600 dark:text-sky-400">{degToCompass(peakHour.direction)}</span>
              <Thermometer className="h-3 w-3 text-orange-400" />
              <span className="text-[10px] font-medium">{Math.round(peakHour.temp)}°</span>
              <span className={`text-[10px] font-semibold ${kiteRating(Math.round(peakHour.wind)).color}`}>
                · {kiteRating(Math.round(peakHour.wind)).label}
              </span>
            </div>
          ) : null}
          <div className="flex ml-auto shrink-0">
            {(["Today", "Tomorrow"] as const).map((label, i) => (
              <button
                key={label}
                onClick={() => setActiveDay(i as 0 | 1)}
                className={`px-2.5 py-0.5 text-[10px] font-semibold rounded-full transition-colors ${
                  activeDay === i
                    ? "bg-sky-500 text-white"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                data-testid={`button-center-weather-${label.toLowerCase()}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 items-center px-3 py-1 text-[9px] text-muted-foreground bg-amber-50/40 dark:bg-amber-950/10 border-b border-border">
          <span>🌅 {fmt(sunrise)}</span>
          <span className="font-medium text-amber-700 dark:text-amber-400 text-center leading-tight">
            {goodHours.length > 0
              ? `Best: ${fmt(goodHours[0].time)}–${fmt(goodHours[goodHours.length - 1].time)}`
              : peakHour ? `Peak ${Math.round(peakHour.wind)} kn @ ${fmt(peakHour.time)}` : "No kite window"}
          </span>
          <span className="text-right">🌇 {fmt(sunset)}</span>
        </div>

        <div
          ref={scrollRef}
          className="overflow-x-auto flex gap-1 px-3 py-3 justify-center"
          style={{ scrollbarWidth: "none" }}
        >
          {dayHours.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 w-full text-center">No data for this day</p>
          ) : (
            dayHours.map((h, idx) => {
              const isNow = idx === nowIdx;
              return (
                <div key={h.time} ref={isNow ? nowCardRef : undefined}>
                  <CenterWindBarCard
                    time={h.time}
                    wind={h.wind}
                    direction={h.direction}
                    temp={h.temp}
                    isCurrent={isNow}
                    isNow={isNow}
                  />
                </div>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-center gap-2 px-3 pb-2 border-t border-border pt-1.5">
          {[
            { color: "bg-slate-300 dark:bg-slate-600", label: "<8" },
            { color: "bg-yellow-400", label: "8–12" },
            { color: "bg-emerald-500", label: "12–20✓" },
            { color: "bg-blue-500", label: "20–28✓" },
            { color: "bg-red-500", label: ">28⚠" },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-0.5">
              <div className={`w-2 h-2 rounded-sm ${color}`} />
              <span className="text-[8px] text-muted-foreground">{label}</span>
            </div>
          ))}
          <span className="text-[8px] text-muted-foreground">kn</span>
        </div>
      </CardContent>
    </Card>
  );
}

function CourseListWidget({ today, bookings, customers, customerBookingInfo }: {
  today: string;
  bookings: Booking[];
  customers: SchoolCustomer[];
  customerBookingInfo: Map<string, { services: string[]; hasUnpaid: boolean }>;
}) {
  const [activeDay, setActiveDay] = useState<0 | 1>(0);
  const tomorrow = addDays(today, 1);
  const dateStr = activeDay === 0 ? today : tomorrow;

  const courses = useMemo(() => {
    const result: { customerName: string; productName: string; isKww: boolean; hasUnpaid: boolean }[] = [];
    for (const b of bookings) {
      if (!b.bookingDate) continue;
      for (const item of b.items) {
        const cat = item.category;
        if (cat !== "Course" && cat !== "Lesson") continue;
        const dur = parseDurationDays(item.productName);
        for (let i = 0; i < dur; i++) {
          if (addDays(b.bookingDate, i) === dateStr) {
            const custKey = b.customerName.toLowerCase().trim();
            const customer = customers.find(c => `${c.firstName} ${c.lastName}`.toLowerCase().trim() === custKey);
            const info = customerBookingInfo.get(custKey);
            result.push({
              customerName: b.customerName,
              productName: item.productName,
              isKww: customer?.guestType === "KiteWorldWide",
              hasUnpaid: info?.hasUnpaid ?? false,
            });
            break;
          }
        }
      }
    }
    return result;
  }, [bookings, customers, customerBookingInfo, dateStr]);

  return (
    <Card data-testid="courses-today-tomorrow">
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <GraduationCap className="h-4 w-4 text-blue-600" />
            <p className="text-sm font-semibold">Courses</p>
          </div>
          <div className="flex shrink-0">
            {(["Today", "Tomorrow"] as const).map((label, i) => (
              <button
                key={label}
                onClick={() => setActiveDay(i as 0 | 1)}
                className={`px-2.5 py-0.5 text-[10px] font-semibold rounded-full transition-colors ${
                  activeDay === i
                    ? "bg-blue-500 text-white"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                data-testid={`button-courses-${label.toLowerCase()}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        {courses.length === 0 ? (
          <p className="text-[11px] text-muted-foreground italic">No courses</p>
        ) : (
          <div className="space-y-1">
            {courses.map((c, i) => (
              <div key={i} className="flex items-center justify-between gap-2 text-[11px]" data-testid={`course-entry-${i}`}>
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className={`shrink-0 text-[8px] px-1 py-0.5 rounded-full font-medium ${c.isKww ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"}`}>
                    {c.isKww ? "KWW" : "W-in"}
                  </span>
                  <span className={`inline-block h-1.5 w-1.5 rounded-full shrink-0 ${c.hasUnpaid ? "bg-red-500" : "bg-green-500"}`} />
                  <span className="font-medium truncate">{c.customerName}</span>
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0 truncate max-w-[140px]">{c.productName}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ForecastTab({ schoolConfigId, currency, stationName }: { schoolConfigId: number; currency: string; stationName: string }) {
  const [detailView, setDetailView] = useState<ForecastDetail>(null);
  const { data: customers = [], isLoading: loadingCustomers } = useQuery<SchoolCustomer[]>({
    queryKey: ["/api/school-customers", schoolConfigId],
  });

  const { data: bookings = [], isLoading: loadingBookings } = useQuery<Booking[]>({
    queryKey: ["/api/school-bookings", schoolConfigId],
  });

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const days = useMemo(() => {
    const result: string[] = [];
    let d = today;
    let safety = 0;
    while (safety < 35) {
      result.push(d);
      d = addDays(d, 1);
      safety++;
    }
    return result;
  }, [today]);

  const customerServiceMap = useMemo(() => {
    const map = new Map<string, { courseDays: Set<string>; rentalDays: Set<string> }>();
    for (const b of bookings) {
      if (!b.bookingDate) continue;
      const key = b.customerName.toLowerCase().trim();
      if (!map.has(key)) map.set(key, { courseDays: new Set(), rentalDays: new Set() });
      const entry = map.get(key)!;
      for (const item of b.items) {
        const cat = item.category;
        if (cat !== "Course" && cat !== "Lesson" && cat !== "Rental") continue;
        const dur = parseDurationDays(item.productName);
        for (let i = 0; i < dur; i++) {
          const d = addDays(b.bookingDate, i);
          if (cat === "Rental") entry.rentalDays.add(d);
          else entry.courseDays.add(d);
        }
      }
    }
    return map;
  }, [bookings]);

  const dayData = useMemo(() => {
    const data: { date: string; courses: number; rentals: number; noService: number; total: number; arrivals: number; departures: number; courseOnly: number; rentalOnly: number; both: number }[] = [];
    for (const day of days) {
      let courseOnly = 0;
      let rentalOnly = 0;
      let both = 0;
      let noService = 0;
      let arrivals = 0;
      let departures = 0;
      for (const c of customers) {
        if (!c.arrivalDate || !c.departureDate) continue;
        if (c.arrivalDate <= day && day <= c.departureDate) {
          const key = `${c.firstName} ${c.lastName}`.toLowerCase().trim();
          const svc = customerServiceMap.get(key);
          const hasCourse = svc ? svc.courseDays.has(day) : false;
          const hasRental = svc ? svc.rentalDays.has(day) : false;
          if (hasCourse && hasRental) both++;
          else if (hasCourse) courseOnly++;
          else if (hasRental) rentalOnly++;
          else noService++;
        }
        if (c.arrivalDate === day) arrivals++;
        if (c.departureDate === day) departures++;
      }
      const total = courseOnly + rentalOnly + both + noService;
      data.push({ date: day, courses: courseOnly + both, rentals: rentalOnly + both, noService, total, arrivals, departures, courseOnly, rentalOnly, both });
    }
    return data;
  }, [customers, days, customerServiceMap]);

  const unpaidCount = useMemo(() => {
    return bookings.filter(b => b.paymentStatus === "unpaid").length;
  }, [bookings]);

  const todayData = dayData[0] || { courses: 0, rentals: 0, noService: 0, total: 0, arrivals: 0, departures: 0, courseOnly: 0, rentalOnly: 0, both: 0 };
  const weekArrivals = dayData.slice(0, 7).reduce((s, d) => s + d.arrivals, 0);
  const weekDepartures = dayData.slice(0, 7).reduce((s, d) => s + d.departures, 0);
  const maxTotal = Math.max(1, ...dayData.map(d => d.total));

  const isLoading = loadingCustomers || loadingBookings;

  const customerBookingInfo = useMemo(() => {
    const map = new Map<string, { services: string[]; hasUnpaid: boolean }>();
    for (const b of bookings) {
      const key = b.customerName.toLowerCase().trim();
      if (!map.has(key)) map.set(key, { services: [], hasUnpaid: false });
      const entry = map.get(key)!;
      if (b.paymentStatus === "unpaid") entry.hasUnpaid = true;
      for (const item of b.items) {
        if (!entry.services.includes(item.productName)) {
          entry.services.push(item.productName);
        }
      }
    }
    return map;
  }, [bookings]);

  const detailData = useMemo(() => {
    if (!detailView) return null;
    const todayStr = today;
    const weekEnd = addDays(todayStr, 6);

    if (detailView === "courses") {
      return customers.filter(c => {
        if (!c.arrivalDate || !c.departureDate) return false;
        if (!(c.arrivalDate <= todayStr && todayStr <= c.departureDate)) return false;
        const key = `${c.firstName} ${c.lastName}`.toLowerCase().trim();
        const svc = customerServiceMap.get(key);
        return svc ? svc.courseDays.has(todayStr) : false;
      });
    }
    if (detailView === "rentals") {
      return customers.filter(c => {
        if (!c.arrivalDate || !c.departureDate) return false;
        if (!(c.arrivalDate <= todayStr && todayStr <= c.departureDate)) return false;
        const key = `${c.firstName} ${c.lastName}`.toLowerCase().trim();
        const svc = customerServiceMap.get(key);
        return svc ? svc.rentalDays.has(todayStr) : false;
      });
    }
    if (detailView === "guests") {
      return customers.filter(c => {
        if (!c.arrivalDate || !c.departureDate) return false;
        return c.arrivalDate <= todayStr && todayStr <= c.departureDate;
      });
    }
    if (detailView === "arrivals") {
      return customers.filter(c => c.arrivalDate && c.arrivalDate >= todayStr && c.arrivalDate <= weekEnd);
    }
    if (detailView === "departures") {
      return customers.filter(c => c.departureDate && c.departureDate >= todayStr && c.departureDate <= weekEnd);
    }
    return null;
  }, [detailView, customers, customerServiceMap, today]);

  const unpaidBookings = useMemo(() => {
    if (detailView !== "unpaid") return [];
    return bookings.filter(b => b.paymentStatus === "unpaid");
  }, [detailView, bookings]);

  const detailLabels: Record<string, string> = {
    courses: "Courses Today",
    rentals: "Rentals Today",
    guests: "Total Guests Today",
    arrivals: "Arrivals (7d)",
    departures: "Departures (7d)",
    unpaid: "Open Payments",
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
        </div>
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (detailView) {
    return (
      <div className="p-4 md:p-6 space-y-3" data-testid="forecast-detail">
        <Button variant="ghost" size="sm" onClick={() => setDetailView(null)} data-testid="btn-forecast-back">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <h3 className="text-sm font-semibold">{detailLabels[detailView]}</h3>
        {detailView === "unpaid" ? (
          unpaidBookings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No open payments.</p>
          ) : (
            <div className="space-y-2">
              {unpaidBookings.map(b => (
                <Card key={b.id}>
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-sm">{b.customerName}</p>
                        <p className="text-xs text-muted-foreground">{b.bookingNumber}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{Number(b.totalAmount).toFixed(2)} {currency}</p>
                        <p className="text-xs text-red-500 flex items-center gap-1 justify-end">
                          <CircleDot className="h-2.5 w-2.5" /> Unpaid
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        ) : detailData && detailData.length > 0 ? (
          <div className="space-y-2">
            {detailData.map(c => {
              const key = `${c.firstName} ${c.lastName}`.toLowerCase().trim();
              const info = customerBookingInfo.get(key);
              const isKww = c.guestType === "KiteWorldWide";
              return (
                <Card key={c.id} data-testid={`detail-card-${c.id}`}>
                  <CardContent className="p-3 space-y-1.5">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-1.5">
                        <p className="font-medium text-sm">{c.firstName} {c.lastName}</p>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${isKww ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"}`}>
                          {isKww ? "KWW" : "Walk-in"}
                        </span>
                        {info && (
                          <span className={`inline-block h-2 w-2 rounded-full ${info.hasUnpaid ? "bg-red-500" : "bg-green-500"}`} />
                        )}
                      </div>
                      <div className="text-right text-[10px] text-muted-foreground shrink-0">
                        {(detailView === "arrivals" && c.arrivalDate) && (
                          <p>{new Date(c.arrivalDate + "T12:00:00Z").toLocaleDateString("en-US", { day: "numeric", month: "short" })}</p>
                        )}
                        {(detailView === "departures" && c.departureDate) && (
                          <p>{new Date(c.departureDate + "T12:00:00Z").toLocaleDateString("en-US", { day: "numeric", month: "short" })}</p>
                        )}
                        {(detailView !== "arrivals" && detailView !== "departures" && c.arrivalDate && c.departureDate) && (
                          <p>{new Date(c.arrivalDate + "T12:00:00Z").toLocaleDateString("en-US", { day: "numeric", month: "short" })} – {new Date(c.departureDate + "T12:00:00Z").toLocaleDateString("en-US", { day: "numeric", month: "short" })}</p>
                        )}
                      </div>
                    </div>
                    {info && info.services.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {info.services.map((s, i) => (
                          <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{s}</span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-muted-foreground italic">No services booked</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No entries.</p>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4" data-testid="forecast-tab">
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
        <Card className="cursor-pointer hover:border-primary/40 transition-colors" onClick={() => setDetailView("courses")} data-testid="card-courses-today">
          <CardContent className="p-2 text-center">
            <GraduationCap className="h-4 w-4 mx-auto text-blue-600 mb-0.5" />
            <p className="text-xl font-bold" data-testid="text-courses-today">{todayData.courses}</p>
            <p className="text-[9px] text-muted-foreground">Courses Today</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary/40 transition-colors" onClick={() => setDetailView("rentals")} data-testid="card-rentals-today">
          <CardContent className="p-2 text-center">
            <Waves className="h-4 w-4 mx-auto text-amber-500 mb-0.5" />
            <p className="text-xl font-bold" data-testid="text-rentals-today">{todayData.rentals}</p>
            <p className="text-[9px] text-muted-foreground">Rentals Today</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary/40 transition-colors" onClick={() => setDetailView("guests")} data-testid="card-guests-today">
          <CardContent className="p-2 text-center">
            <Users className="h-4 w-4 mx-auto text-primary mb-0.5" />
            <p className="text-xl font-bold" data-testid="text-guests-today">{todayData.total}</p>
            <p className="text-[9px] text-muted-foreground">Total Guests</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary/40 transition-colors" onClick={() => setDetailView("arrivals")} data-testid="card-arrivals">
          <CardContent className="p-2 text-center">
            <ArrowDownRight className="h-4 w-4 mx-auto text-green-600 mb-0.5" />
            <p className="text-xl font-bold" data-testid="text-week-arrivals">{weekArrivals}</p>
            <p className="text-[9px] text-muted-foreground">Arrivals (7d)</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary/40 transition-colors" onClick={() => setDetailView("departures")} data-testid="card-departures">
          <CardContent className="p-2 text-center">
            <ArrowUpRight className="h-4 w-4 mx-auto text-red-500 mb-0.5" />
            <p className="text-xl font-bold" data-testid="text-week-departures">{weekDepartures}</p>
            <p className="text-[9px] text-muted-foreground">Departures (7d)</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary/40 transition-colors" onClick={() => setDetailView("unpaid")} data-testid="card-unpaid">
          <CardContent className="p-2 text-center">
            <XCircle className="h-4 w-4 mx-auto text-orange-500 mb-0.5" />
            <p className="text-xl font-bold" data-testid="text-unpaid-count">{unpaidCount}</p>
            <p className="text-[9px] text-muted-foreground">Open Payments</p>
          </CardContent>
        </Card>
      </div>

      <WindForecastWidget stationName={stationName} />

      <div>
        <p className="text-sm font-semibold mb-2 flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          35-Day Service Overview
        </p>
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <div className="flex" style={{ minWidth: days.length * 44 }}>
              {dayData.map((d) => {
                const date = new Date(d.date + "T12:00:00Z");
                const isToday = d.date === today;
                const isWeekend = date.getUTCDay() % 6 === 0;
                const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                const courseOnlyPct = Math.round((d.courseOnly / maxTotal) * 100);
                const bothPct = Math.round((d.both / maxTotal) * 100);
                const rentalOnlyPct = Math.round((d.rentalOnly / maxTotal) * 100);
                const noSvcPct = Math.round((d.noService / maxTotal) * 100);
                return (
                  <div
                    key={d.date}
                    className={`flex flex-col items-center shrink-0 border-r last:border-r-0 pb-1 ${isToday ? "bg-primary/10" : isWeekend ? "bg-muted/40" : ""}`}
                    style={{ width: 44 }}
                    data-testid={`forecast-day-${d.date}`}
                  >
                    <p className={`text-[9px] pt-1 ${isToday ? "font-bold text-primary" : "text-muted-foreground"}`}>
                      {dayNames[date.getUTCDay()]}
                    </p>
                    <p className={`text-[10px] font-medium ${isToday ? "text-primary" : ""}`}>
                      {date.getUTCDate()}.{date.getUTCMonth() + 1}
                    </p>
                    <div className="flex-1 flex flex-col justify-end items-center mt-1" style={{ height: 100 }}>
                      {(() => {
                        const segments: { key: string; count: number; cls: string; style?: Record<string, string | number> }[] = [];
                        if (d.noService > 0) segments.push({ key: "ns", count: d.noService, cls: isToday ? "bg-gray-400 dark:bg-gray-500" : "bg-gray-300 dark:bg-gray-600" });
                        if (d.rentalOnly > 0) segments.push({ key: "ro", count: d.rentalOnly, cls: isToday ? "bg-amber-500" : "bg-amber-400" });
                        if (d.both > 0) segments.push({ key: "bt", count: d.both, cls: "", style: { background: "linear-gradient(90deg, #3b82f6 50%, #f59e0b 50%)" } });
                        if (d.courseOnly > 0) segments.push({ key: "co", count: d.courseOnly, cls: isToday ? "bg-blue-600" : "bg-blue-500" });
                        return segments.map((seg, i) => (
                          <div
                            key={seg.key}
                            className={`w-7 ${i === 0 ? "rounded-t" : ""} ${seg.cls}`}
                            style={{ height: Math.max(8, Math.round((seg.count / maxTotal) * 100)), minHeight: 8, ...seg.style }}
                          />
                        ));
                      })()}
                    </div>
                    <p className={`text-[10px] font-bold mt-0.5 ${isToday ? "text-primary" : ""}`}>{d.total}</p>
                    <div className="flex items-center gap-0.5 mt-0.5 h-3">
                      {d.arrivals > 0 && (
                        <span className="text-[8px] text-green-600 font-medium flex items-center">
                          <ArrowDownRight className="h-2.5 w-2.5" />{d.arrivals}
                        </span>
                      )}
                      {d.departures > 0 && (
                        <span className="text-[8px] text-red-500 font-medium flex items-center">
                          <ArrowUpRight className="h-2.5 w-2.5" />{d.departures}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 mt-2 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded bg-blue-500" /> Courses</span>
          <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded bg-amber-400" /> Rentals</span>
          <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded" style={{ background: "linear-gradient(90deg, #3b82f6 50%, #f59e0b 50%)" }} /> Both</span>
          <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded bg-gray-300 dark:bg-gray-600" /> No Service</span>
        </div>
      </div>

      <CourseListWidget today={today} bookings={bookings} customers={customers} customerBookingInfo={customerBookingInfo} />
    </div>
  );
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

function FinanceTab({ schoolConfigId, currency }: { schoolConfigId: number; currency: string }) {
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
    return bookings.filter(b => b.bookingDate >= startDate && b.bookingDate <= endDate);
  }, [bookings, startDate, endDate]);

  const stats = useMemo(() => {
    let cashTotal = 0, cardTotal = 0, unpaidTotal = 0;
    for (const b of filteredBookings) {
      const amt = parseFloat(b.totalAmount) || 0;
      if (b.paymentStatus === "cash") cashTotal += amt;
      else if (b.paymentStatus === "credit_card") cardTotal += amt;
      else unpaidTotal += amt;
    }
    const paidTotal = cashTotal + cardTotal;
    const expenseTotal = expenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
    const opening = parseFloat(cashBalance) || 0;
    const currentCash = opening + cashTotal;
    const netResult = paidTotal - expenseTotal;
    return { paidTotal, cashTotal, cardTotal, unpaidTotal, expenseTotal, opening, currentCash, netResult };
  }, [filteredBookings, expenses, cashBalance]);

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

      <div className="text-xs text-muted-foreground">
        {startDate === endDate ? startDate : `${startDate} — ${endDate}`}
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
                      <Eye className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
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

function CustomersTab({ schoolConfigId, currency }: { schoolConfigId: number; currency: string }) {
  const { isAdmin, isStationLead } = useAuth();
  const { toast } = useToast();
  const canEdit = isAdmin || isStationLead;
  const [search, setSearch] = useState("");
  const [activeOnly, setActiveOnly] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<SchoolCustomer | null>(null);
  const [editMode, setEditMode] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [nationality, setNationality] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [guestType, setGuestType] = useState<"KiteWorldWide" | "Walk-in">("Walk-in");
  const [kiteLevel, setKiteLevel] = useState("Beginner");
  const [weightKg, setWeightKg] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [arrivalDate, setArrivalDate] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [notes, setNotes] = useState("");

  const { data: customers = [], isLoading } = useQuery<SchoolCustomer[]>({
    queryKey: ["/api/school-customers", schoolConfigId],
  });

  const { data: bookings = [] } = useQuery<Booking[]>({
    queryKey: ["/api/school-bookings", schoolConfigId],
  });

  const customerBookingsMap = useMemo(() => {
    const map = new Map<string, BookingItem[]>();
    for (const b of bookings) {
      const key = b.customerName.toLowerCase().trim();
      const existing = map.get(key) || [];
      map.set(key, [...existing, ...b.items]);
    }
    return map;
  }, [bookings]);

  const customerFullBookingsMap = useMemo(() => {
    const map = new Map<string, Booking[]>();
    for (const b of bookings) {
      const key = b.customerName.toLowerCase().trim();
      const existing = map.get(key) || [];
      map.set(key, [...existing, b]);
    }
    return map;
  }, [bookings]);

  const paymentUpdateMutation = useMutation({
    mutationFn: ({ id, paymentStatus }: { id: number; paymentStatus: string }) =>
      apiRequest("PATCH", `/api/school-bookings/${id}/payment`, { paymentStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/school-bookings", schoolConfigId] });
      toast({ title: "Payment status updated" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const emailMutation = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/school-bookings/${id}/email`),
    onSuccess: () => toast({ title: "Receipt sent via email" }),
    onError: (e: Error) => toast({ title: "Email failed", description: e.message, variant: "destructive" }),
  });

  function isCurrentlyHere(arrival: string, departure: string): boolean {
    const today = new Date().toISOString().slice(0, 10);
    return arrival <= today && today <= departure;
  }

  const filtered = useMemo(() => {
    let list = customers;
    if (search) {
      const q = search.toLowerCase();
      const isBookingSearch = q.startsWith("sch-") || /^\d{3,}$/.test(q);
      if (isBookingSearch) {
        const matchingNames = new Set<string>();
        for (const b of bookings) {
          if (b.bookingNumber.toLowerCase().includes(q)) {
            matchingNames.add(b.customerName.toLowerCase().trim());
          }
        }
        list = list.filter(c => matchingNames.has(`${c.firstName} ${c.lastName}`.toLowerCase().trim()));
      } else {
        list = list.filter(c =>
          `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q)
        );
      }
    }
    if (activeOnly) {
      list = list.filter(c => isCurrentlyHere(c.arrivalDate, c.departureDate));
    }
    return list;
  }, [customers, search, activeOnly, bookings]);

  const createMutation = useMutation({
    mutationFn: (data: object) => apiRequest("POST", "/api/school-customers", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/school-customers", schoolConfigId] });
      setShowForm(false);
      resetForm();
      toast({ title: "Customer registered" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: object }) => apiRequest("PATCH", `/api/school-customers/${id}`, data),
    onSuccess: async (res) => {
      const updated = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/school-customers", schoolConfigId] });
      setSelectedCustomer(updated);
      setEditMode(false);
      toast({ title: "Customer updated" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/school-customers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/school-customers", schoolConfigId] });
      setSelectedCustomer(null);
      toast({ title: "Customer deleted" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  function resetForm() {
    setGuestType("Walk-in"); setFirstName(""); setLastName(""); setEmail(""); setPhone("");
    setNationality(""); setDateOfBirth(""); setKiteLevel("Beginner");
    setWeightKg(""); setEmergencyContact(""); setArrivalDate("");
    setDepartureDate(""); setNotes("");
  }

  function openCreate() {
    resetForm();
    setShowForm(true);
  }

  function startEdit() {
    if (!selectedCustomer) return;
    setGuestType(selectedCustomer.guestType ?? "Walk-in");
    setFirstName(selectedCustomer.firstName);
    setLastName(selectedCustomer.lastName);
    setEmail(selectedCustomer.email);
    setPhone(selectedCustomer.phone);
    setNationality(selectedCustomer.nationality);
    setDateOfBirth(selectedCustomer.dateOfBirth);
    setKiteLevel(selectedCustomer.kiteLevel);
    setWeightKg(selectedCustomer.weightKg ? String(selectedCustomer.weightKg) : "");
    setEmergencyContact(selectedCustomer.emergencyContact);
    setArrivalDate(selectedCustomer.arrivalDate);
    setDepartureDate(selectedCustomer.departureDate);
    setNotes(selectedCustomer.notes ?? "");
    setEditMode(true);
  }

  function handleSubmitCreate() {
    createMutation.mutate({
      schoolConfigId,
      guestType,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      nationality,
      dateOfBirth,
      kiteLevel,
      weightKg: weightKg ? parseInt(weightKg) : null,
      emergencyContact: emergencyContact.trim(),
      arrivalDate,
      departureDate,
      notes: notes.trim() || null,
    });
  }

  function handleSubmitEdit() {
    if (!selectedCustomer) return;
    updateMutation.mutate({
      id: selectedCustomer.id,
      data: {
        guestType,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        nationality,
        dateOfBirth,
        kiteLevel,
        weightKg: weightKg ? parseInt(weightKg) : null,
        emergencyContact: emergencyContact.trim(),
        arrivalDate,
        departureDate,
        notes: notes.trim() || null,
      },
    });
  }

  const isFormValid = firstName.trim() && lastName.trim() && email.trim() && phone.trim() &&
    nationality && dateOfBirth && kiteLevel && emergencyContact.trim() && arrivalDate && departureDate;

  const formFields = (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Guest Type</p>
        <div className="flex gap-2">
          {(["KiteWorldWide", "Walk-in"] as const).map(t => (
            <button
              key={t}
              type="button"
              data-testid={`btn-guest-type-${t}`}
              onClick={() => setGuestType(t)}
              className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                guestType === t
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border text-muted-foreground hover:bg-accent/50"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">First Name *</Label>
          <Input data-testid="input-first-name" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Sophie" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Last Name *</Label>
          <Input data-testid="input-last-name" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Müller" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Email *</Label>
          <Input data-testid="input-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="guest@email.com" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Phone *</Label>
          <Input data-testid="input-phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+49 170 1234567" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Nationality *</Label>
          <Select value={nationality} onValueChange={setNationality}>
            <SelectTrigger data-testid="select-nationality"><SelectValue placeholder="Select country" /></SelectTrigger>
            <SelectContent>
              {COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Date of Birth *</Label>
          <Input data-testid="input-dob" type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Kite Level *</Label>
          <Select value={kiteLevel} onValueChange={setKiteLevel}>
            <SelectTrigger data-testid="select-kite-level"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Beginner">Beginner</SelectItem>
              <SelectItem value="Intermediate">Intermediate</SelectItem>
              <SelectItem value="Advanced">Advanced</SelectItem>
              <SelectItem value="Pro">Pro</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Weight (kg)</Label>
          <Input data-testid="input-weight" type="number" min="30" max="200" value={weightKg} onChange={e => setWeightKg(e.target.value)} placeholder="75" />
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Emergency Contact *</Label>
        <Input data-testid="input-emergency" value={emergencyContact} onChange={e => setEmergencyContact(e.target.value)} placeholder="Hans Müller +49 170 9876543" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Arrival *</Label>
          <Input data-testid="input-arrival" type="date" value={arrivalDate} onChange={e => setArrivalDate(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Departure *</Label>
          <Input data-testid="input-departure" type="date" value={departureDate} onChange={e => setDepartureDate(e.target.value)} />
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Notes</Label>
        <Textarea data-testid="input-notes" rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any additional info..." />
      </div>
    </div>
  );

  if (selectedCustomer && !editMode) {
    const c = selectedCustomer;
    const here = isCurrentlyHere(c.arrivalDate, c.departureDate);
    const custKey = `${c.firstName} ${c.lastName}`.toLowerCase().trim();
    const custBookings = customerFullBookingsMap.get(custKey) || [];
    return (
      <div className="p-4 md:p-6 max-w-2xl md:max-w-3xl mx-auto space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setSelectedCustomer(null)} data-testid="btn-back">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-bold" data-testid="text-customer-name">{c.firstName} {c.lastName}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge variant={c.guestType === "KiteWorldWide" ? "default" : "secondary"} className="text-xs" data-testid="badge-guest-type">
                    {c.guestType === "KiteWorldWide" ? "KiteWorldWide" : "Walk-in"}
                  </Badge>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${KITE_LEVEL_COLORS[c.kiteLevel]}`}>{c.kiteLevel}</span>
                  {here && <Badge variant="outline" className="text-xs text-green-700 border-green-300 bg-green-50 dark:bg-green-900/20 dark:text-green-400">Currently here</Badge>}
                </div>
              </div>
              {isAdmin && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={startEdit} data-testid="btn-edit-customer"><Pencil className="h-3 w-3 mr-1" /> Edit</Button>
                  <Button variant="destructive" size="sm" onClick={() => { if (confirm("Delete this customer?")) deleteMutation.mutate(c.id); }} data-testid="btn-delete-customer"><Trash2 className="h-3 w-3" /></Button>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
              <div><p className="text-xs text-muted-foreground">Email</p><p data-testid="text-email">{c.email}</p></div>
              <div><p className="text-xs text-muted-foreground">Phone</p><p data-testid="text-phone">{c.phone}</p></div>
              <div><p className="text-xs text-muted-foreground">Nationality</p><p>{c.nationality}</p></div>
              <div><p className="text-xs text-muted-foreground">Date of Birth</p><p>{c.dateOfBirth}</p></div>
              {c.weightKg && <div><p className="text-xs text-muted-foreground">Weight</p><p>{c.weightKg} kg</p></div>}
              <div><p className="text-xs text-muted-foreground">Emergency Contact</p><p>{c.emergencyContact}</p></div>
              <div><p className="text-xs text-muted-foreground">Arrival</p><p>{c.arrivalDate}</p></div>
              <div><p className="text-xs text-muted-foreground">Departure</p><p>{c.departureDate}</p></div>
            </div>
            {c.notes && (
              <div className="text-sm">
                <p className="text-xs text-muted-foreground">Notes</p>
                <p>{c.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div>
          <p className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Bookings ({custBookings.length})
          </p>
          {custBookings.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">No bookings found for this customer.</p>
          ) : (
            <div className="space-y-3">
              {custBookings.map(booking => {
                const pay = PAYMENT_LABELS[booking.paymentStatus];
                const PayIcon = pay.icon;
                return (
                  <Card key={booking.id} data-testid={`customer-booking-${booking.id}`}>
                    <CardContent className="p-3 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-sm text-primary" data-testid={`text-booking-number-${booking.id}`}>
                              {booking.bookingNumber}
                            </span>
                            <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${pay.color}`}>
                              <PayIcon className="h-3 w-3" />
                              {pay.label}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {booking.items.length} items · {booking.bookingDate || ""}
                            {booking.createdByName && ` · ${booking.createdByName}`}
                          </p>
                          {booking.emailSentAt && <p className="text-[10px] text-green-600 mt-0.5">Email sent {new Date(booking.emailSentAt).toLocaleDateString("en-US")}</p>}
                        </div>
                        <p className="font-bold text-base shrink-0" data-testid={`text-booking-total-${booking.id}`}>
                          {formatPrice(booking.totalAmount, booking.currency)}
                        </p>
                      </div>

                      <div className="border rounded-lg overflow-hidden">
                        {booking.items.map((item, idx) => (
                          <div key={item.id || idx} className={`flex items-center justify-between p-2 text-sm ${idx % 2 === 0 ? "bg-muted/30" : ""}`}>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium">{item.productName}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${CATEGORY_COLORS[item.category] || ""}`}>{item.category}</span>
                                <span className="text-[10px] text-muted-foreground">× {item.quantity}</span>
                              </div>
                            </div>
                            <span className="font-mono text-xs shrink-0">
                              {booking.currency} {parseFloat(item.lineTotal).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {canEdit && (
                          <Select value={booking.paymentStatus} onValueChange={(v) => paymentUpdateMutation.mutate({ id: booking.id, paymentStatus: v })}>
                            <SelectTrigger className="h-7 w-28 text-xs" data-testid={`select-payment-${booking.id}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unpaid">Unpaid</SelectItem>
                              <SelectItem value="cash">Cash</SelectItem>
                              <SelectItem value="credit_card">Card</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                        <a
                          href={`/api/school-bookings/${booking.id}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md border text-xs font-medium hover:bg-muted transition-colors"
                          data-testid={`btn-pdf-${booking.id}`}
                        >
                          <FileDown className="h-3 w-3" /> PDF
                        </a>
                        {booking.customerEmail && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => emailMutation.mutate(booking.id)}
                            disabled={emailMutation.isPending}
                            data-testid={`btn-email-${booking.id}`}
                          >
                            {emailMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Mail className="h-3 w-3 mr-1" />}
                            Email
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (selectedCustomer && editMode) {
    return (
      <div className="p-4 md:p-6 max-w-2xl md:max-w-3xl mx-auto space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setEditMode(false)} data-testid="btn-cancel-edit">
          <ArrowLeft className="h-4 w-4 mr-1" /> Cancel
        </Button>
        <Card>
          <CardContent className="p-4 space-y-4">
            <p className="text-lg font-bold">Edit Customer</p>
            {formFields}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditMode(false)}>Cancel</Button>
              <Button data-testid="btn-save-customer" disabled={!isFormValid || updateMutation.isPending} onClick={handleSubmitEdit}>
                Save
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">{filtered.length} Customers</p>
        <Button size="sm" onClick={openCreate} data-testid="btn-add-customer">
          <Plus className="h-4 w-4 mr-1" /> Register Guest
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            data-testid="input-search-customers"
            className="pl-9"
            placeholder="Search name, email, or booking #..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={activeOnly} onCheckedChange={setActiveOnly} data-testid="toggle-active-only" />
          <span className="text-xs text-muted-foreground whitespace-nowrap">Active</span>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">{search || activeOnly ? "No matching customers." : "No customers registered yet."}</p>
      ) : (
        <div className="space-y-1.5">
          {filtered.map(c => {
            const here = isCurrentlyHere(c.arrivalDate, c.departureDate);
            const custKey = `${c.firstName} ${c.lastName}`.toLowerCase().trim();
            const custItems = customerBookingsMap.get(custKey) || [];
            const custBkgs = customerFullBookingsMap.get(custKey) || [];
            const hasUnpaid = custBkgs.some(b => b.paymentStatus === "unpaid");
            const hasBookings = custBkgs.length > 0;
            const categoryIcons: Record<string, { icon: LucideIcon; color: string; label: string }> = {
              Course: { icon: GraduationCap, color: "text-blue-600 dark:text-blue-400", label: "Course" },
              Lesson: { icon: GraduationCap, color: "text-green-600 dark:text-green-400", label: "Lesson" },
              Rental: { icon: Wind, color: "text-orange-600 dark:text-orange-400", label: "Rental" },
              Other: { icon: WrenchIcon, color: "text-gray-600 dark:text-gray-400", label: "Service" },
            };
            const arrFmt = c.arrivalDate ? new Date(c.arrivalDate + "T12:00:00Z").toLocaleDateString("en-US", { day: "numeric", month: "short" }) : "–";
            const depFmt = c.departureDate ? new Date(c.departureDate + "T12:00:00Z").toLocaleDateString("en-US", { day: "numeric", month: "short" }) : "–";
            return (
              <div
                key={c.id}
                data-testid={`row-customer-${c.id}`}
                onClick={() => { setSelectedCustomer(c); setEditMode(false); }}
                className="px-3 py-2.5 rounded-lg border bg-card hover:bg-accent/30 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-medium text-sm">{c.firstName} {c.lastName}</p>
                      {hasBookings && (
                        <span
                          className={`inline-block h-2 w-2 rounded-full shrink-0 ${hasUnpaid ? "bg-red-500" : "bg-green-500"}`}
                          title={hasUnpaid ? "Has unpaid bookings" : "All bookings paid"}
                          data-testid={`payment-indicator-${c.id}`}
                        />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <Calendar className="h-3 w-3" />
                        {arrFmt} → {depFmt}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center shrink-0 gap-1">
                    <Badge variant={c.guestType === "KiteWorldWide" ? "default" : "secondary"} className="text-[10px] min-w-[42px] justify-center">
                      {c.guestType === "KiteWorldWide" ? "KWW" : "Walk-in"}
                    </Badge>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium text-center w-[72px] truncate ${KITE_LEVEL_COLORS[c.kiteLevel]}`}>{c.kiteLevel}</span>
                    {here && <Badge variant="outline" className="text-[10px] text-green-700 border-green-300 bg-green-50 dark:bg-green-900/20 dark:text-green-400">Here</Badge>}
                  </div>
                </div>
                {custItems.length > 0 && (
                  <div className="flex flex-col gap-0.5 mt-1.5">
                    {custItems.map((item, idx) => {
                      const info = categoryIcons[item.category] || categoryIcons.Other;
                      const Icon = info.icon;
                      return (
                        <span
                          key={idx}
                          className={`inline-flex items-center gap-1 text-[10px] ${info.color}`}
                        >
                          <Icon className="h-3 w-3 shrink-0" />
                          {item.quantity > 1 ? `${item.quantity}× ` : ""}{item.productName}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Register Guest</DialogTitle>
          </DialogHeader>
          {formFields}
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button data-testid="btn-submit-customer" disabled={!isFormValid || createMutation.isPending} onClick={handleSubmitCreate}>
              Register
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
