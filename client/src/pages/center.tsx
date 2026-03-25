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

type TabId = "bookings" | "customers" | "sales" | "incidents";
type BookingSubTab = "new" | "overview" | "timeline";

function formatPrice(price: string, curr: string) {
  return `${curr} ${parseFloat(price).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function CenterPage() {
  const { user, isAdmin, isStationLead, isSimulating, simStationId } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<TabId>("bookings");
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
    { id: "bookings", label: "Buchungen", icon: Receipt },
    { id: "customers", label: "Kunden", icon: Users },
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
        {activeTab === "customers" && selectedSchoolId && (
          <CustomersTab schoolConfigId={selectedSchoolId} />
        )}
        {activeTab === "customers" && !selectedSchoolId && (
          <div className="p-8 text-center text-muted-foreground">Select a school to manage customers.</div>
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
          { id: "new" as const, label: "Neue Buchung" },
          { id: "overview" as const, label: "Übersicht" },
          { id: "timeline" as const, label: "Zeitplan" },
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
          onCreated={() => onSubTabChange("overview")}
        />
      )}
      {subTab === "overview" && (
        <BookingOverview schoolConfigId={schoolConfigId} currency={currency} />
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
          placeholder="Kunde suchen..."
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
              <p className="text-sm text-muted-foreground px-3 py-3 text-center">Kein Kunde gefunden</p>
              <div className="border-t">
                <button
                  data-testid="btn-create-new-customer"
                  className="w-full text-left px-3 py-2.5 hover:bg-muted transition-colors flex items-center gap-2 text-primary font-medium"
                  onClick={() => { setShowCreateDialog(true); setOpen(false); }}
                >
                  <UserPlus className="h-4 w-4" />
                  <span className="text-sm">Neuen Kunden anlegen</span>
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
      toast({ title: "Kunde angelegt" });
      onCreated(created);
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
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
            <UserPlus className="h-5 w-5" /> Neuen Kunden anlegen
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
          <Button variant="outline" onClick={onClose}>Abbrechen</Button>
          <Button data-testid="btn-submit-new-customer" disabled={!isValid || createMutation.isPending} onClick={handleSubmit}>
            {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Anlegen
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
    return <p className="text-sm text-muted-foreground text-center py-6">Alle Produkte wurden hinzugefügt</p>;
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
                            <p className="text-[11px] font-bold text-primary">{currency} {parseFloat(product.defaultPrice).toLocaleString("de-DE", { minimumFractionDigits: 2 })}</p>
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
                        <p className="text-[11px] font-bold text-primary mt-0.5">{currency} {parseFloat(product.defaultPrice).toLocaleString("de-DE", { minimumFractionDigits: 2 })}</p>
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
      toast({ title: `Buchung ${booking.bookingNumber} erstellt` });
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
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  const canSubmit = selectedCustomerId && customerName.trim() && items.length > 0 && items.every(i => parseFloat(i.unitPrice) > 0);

  if (showProducts) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowProducts(false)} data-testid="btn-back-from-products">
            <ArrowLeft className="h-4 w-4 mr-1" /> Zurück
          </Button>
          <h2 className="text-base font-semibold">Produkt hinzufügen</h2>
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
              <Plus className="h-4 w-4 mr-1" /> Eigenes Produkt
            </Button>
          ) : (
            <div className="space-y-2 border rounded-lg p-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Eigenes Produkt</p>
              <Input
                data-testid="input-custom-name"
                placeholder="Bezeichnung"
                value={customName}
                onChange={e => setCustomName(e.target.value)}
              />
              <Input
                data-testid="input-custom-price"
                type="number"
                step="0.01"
                min="0"
                placeholder={`Preis (${currency})`}
                value={customPrice}
                onChange={e => setCustomPrice(e.target.value)}
              />
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => setShowCustomItem(false)}>Abbrechen</Button>
                <Button
                  size="sm"
                  className="flex-1"
                  disabled={!customName.trim() || !customPrice.trim()}
                  onClick={() => { addCustomItem(); setShowProducts(false); }}
                  data-testid="btn-add-custom-item"
                >
                  Hinzufügen
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-5 max-w-2xl mx-auto pb-24">
      {nextNum && (
        <div className="flex items-center gap-2">
          <Receipt className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-mono text-muted-foreground" data-testid="text-next-booking-number">{nextNum.bookingNumber}</span>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Kunde</p>
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
          <p className="text-xs text-muted-foreground">Suche einen bestehenden Kunden oder lege einen neuen an.</p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Produkte</p>
          <Button variant="outline" size="sm" onClick={() => setShowProducts(true)} data-testid="btn-open-product-picker">
            <Plus className="h-3 w-3 mr-1" /> Hinzufügen
          </Button>
        </div>

        {items.length === 0 ? (
          <div
            className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
            onClick={() => setShowProducts(true)}
            data-testid="empty-items-placeholder"
          >
            <Plus className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
            <p className="text-sm text-muted-foreground">Produkt hinzufügen</p>
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
                    <Label className="text-[10px]">Menge</Label>
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
                    <Label className="text-[10px]">Preis ({currency})</Label>
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
          <Label className="text-xs">Datum</Label>
          <Input
            type="date"
            value={bookingDate}
            onChange={e => setBookingDate(e.target.value)}
            data-testid="input-booking-date"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Zahlung</Label>
          <Select value={paymentStatus} onValueChange={setPaymentStatus}>
            <SelectTrigger className="h-9" data-testid="select-payment-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unpaid">Offen</SelectItem>
              <SelectItem value="cash">Bar</SelectItem>
              <SelectItem value="credit_card">Karte</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Notizen</Label>
        <Textarea
          placeholder="Optionale Notizen..."
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={2}
          data-testid="input-booking-notes"
        />
      </div>

      {items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 md:static md:mt-4 bg-background border-t md:border md:rounded-xl p-4 z-40 shadow-lg md:shadow-none">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-semibold">Gesamt</span>
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
            Buchung erstellen
          </Button>
        </div>
      )}
    </div>
  );
}

function BookingOverview({
  schoolConfigId, currency,
}: {
  schoolConfigId: number;
  currency: string;
}) {
  const { isAdmin, isStationLead } = useAuth();
  const { toast } = useToast();
  const canEdit = isAdmin || isStationLead;

  const [searchTerm, setSearchTerm] = useState("");
  const [filterPayment, setFilterPayment] = useState("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [detailBooking, setDetailBooking] = useState<Booking | null>(null);

  const { data: bookings = [], isLoading } = useQuery<Booking[]>({
    queryKey: ["/api/school-bookings", schoolConfigId],
    staleTime: 0,
  });

  const filteredBookings = useMemo(() => {
    let result = bookings;
    if (filterPayment !== "all") {
      result = result.filter(b => b.paymentStatus === filterPayment);
    }
    if (filterDateFrom) {
      result = result.filter(b => b.bookingDate >= filterDateFrom);
    }
    if (filterDateTo) {
      result = result.filter(b => b.bookingDate <= filterDateTo);
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
  }, [bookings, filterPayment, filterDateFrom, filterDateTo, searchTerm]);

  const paymentUpdateMutation = useMutation({
    mutationFn: ({ id, paymentStatus }: { id: number; paymentStatus: string }) =>
      apiRequest("PATCH", `/api/school-bookings/${id}/payment`, { paymentStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/school-bookings", schoolConfigId] });
      toast({ title: "Zahlungsstatus aktualisiert" });
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  const emailMutation = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/school-bookings/${id}/email`),
    onSuccess: () => toast({ title: "Beleg per E-Mail versendet" }),
    onError: (e: Error) => toast({ title: "E-Mail fehlgeschlagen", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Suchen..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-9"
            data-testid="input-search-bookings"
          />
        </div>
        <Select value={filterPayment} onValueChange={setFilterPayment}>
          <SelectTrigger className="w-32" data-testid="select-filter-payment">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle</SelectItem>
            <SelectItem value="unpaid">Offen</SelectItem>
            <SelectItem value="cash">Bar</SelectItem>
            <SelectItem value="credit_card">Karte</SelectItem>
          </SelectContent>
        </Select>
        <Input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} className="w-32" data-testid="input-filter-date-from" />
        <Input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} className="w-32" data-testid="input-filter-date-to" />
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : filteredBookings.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          <Receipt className="h-8 w-8 mx-auto opacity-30 mb-2" />
          <p className="text-sm">{bookings.length === 0 ? "Noch keine Buchungen vorhanden." : "Keine Buchungen gefunden."}</p>
        </div>
      ) : (
        <div className="space-y-2">
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
                <CardContent className="p-3">
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
                      <p className="text-sm font-medium mt-0.5">{booking.customerName}</p>
                      <p className="text-xs text-muted-foreground">
                        {booking.items.length} Pos. · {booking.bookingDate || ""}
                        {booking.createdByName && ` · ${booking.createdByName}`}
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

      {detailBooking && (
        <BookingDetailDialog
          booking={detailBooking}
          canEdit={canEdit}
          onClose={() => setDetailBooking(null)}
          onPaymentUpdate={(status) => {
            paymentUpdateMutation.mutate({ id: detailBooking.id, paymentStatus: status });
            setDetailBooking({ ...detailBooking, paymentStatus: status as "unpaid" | "cash" | "credit_card" });
          }}
          onEmail={() => emailMutation.mutate(detailBooking.id)}
          emailPending={emailMutation.isPending}
        />
      )}
    </div>
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
              <p className="text-xs text-muted-foreground">Kunde</p>
              <p className="font-medium">{booking.customerName}</p>
              {booking.customerEmail && <p className="text-xs text-muted-foreground">{booking.customerEmail}</p>}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Datum</p>
              <p className="font-medium">{booking.bookingDate || "—"}</p>
              {booking.createdByName && <p className="text-xs text-muted-foreground">von {booking.createdByName}</p>}
              {booking.emailSentAt && <p className="text-xs text-green-600">Versendet {new Date(booking.emailSentAt).toLocaleDateString("de-DE")}</p>}
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-1">Zahlungsstatus</p>
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
                    <SelectItem value="unpaid">Offen</SelectItem>
                    <SelectItem value="cash">Bar</SelectItem>
                    <SelectItem value="credit_card">Karte</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-2">Positionen</p>
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
                <span>Gesamt</span>
                <span className="text-lg" data-testid="text-detail-total">
                  {booking.currency} {parseFloat(booking.totalAmount).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {booking.notes && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Notizen</p>
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
              <FileDown className="h-4 w-4" /> PDF
            </a>
            {booking.customerEmail && (
              <Button
                variant="outline"
                size="sm"
                onClick={onEmail}
                disabled={emailPending}
                data-testid="btn-email-receipt"
              >
                {emailPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Mail className="h-4 w-4 mr-1" />}
                E-Mail senden
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
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
  const d = new Date(date + "T00:00:00");
  d.setDate(d.getDate() + days);
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
    staleTime: 0,
  });

  const today = new Date().toISOString().slice(0, 10);
  const startDate = addDays(today, -3);
  const endDate = addDays(today, 10);

  const days = useMemo(() => {
    const result: string[] = [];
    let d = startDate;
    while (d <= endDate) {
      result.push(d);
      d = addDays(d, 1);
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
      <div className="p-4 space-y-3">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const DAY_W = 80;
  const LABEL_W = 160;

  function formatDay(d: string) {
    const date = new Date(d + "T00:00:00");
    const dayNames = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
    return {
      weekday: dayNames[date.getDay()],
      day: date.getDate(),
      month: date.getMonth() + 1,
    };
  }

  function renderSection(title: string, items: TimelineItem[], barColor: string, bgColor: string) {
    return (
      <div className="mb-6" data-testid={`timeline-section-${title.toLowerCase()}`}>
        <div className="flex items-center gap-2 px-4 mb-2">
          {title === "Kurse" ? <GraduationCap className="h-4 w-4 text-blue-600" /> : <Wind className="h-4 w-4 text-orange-600" />}
          <h3 className="text-sm font-semibold">{title}</h3>
          <Badge variant="secondary" className="text-[10px]">{items.length}</Badge>
        </div>

        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground px-4 py-3">Keine Buchungen in diesem Zeitraum</p>
        ) : (
          <div className="border rounded-lg overflow-hidden mx-2">
            <div className="overflow-x-auto" ref={title === "Kurse" ? scrollRef : undefined}>
              <div style={{ minWidth: LABEL_W + days.length * DAY_W }}>
                <div className="flex border-b bg-muted/50 sticky top-0 z-10">
                  <div className="shrink-0 border-r bg-background sticky left-0 z-20 px-2 py-1.5 flex items-center" style={{ width: LABEL_W }}>
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase">Kunde / Produkt</span>
                  </div>
                  {days.map(d => {
                    const { weekday, day, month } = formatDay(d);
                    const isToday = d === today;
                    const isWeekend = new Date(d + "T00:00:00").getDay() % 6 === 0;
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
                      const isWeekend = new Date(d + "T00:00:00").getDay() % 6 === 0;
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
          {new Date(startDate + "T00:00:00").toLocaleDateString("de-DE", { day: "numeric", month: "short" })} – {new Date(endDate + "T00:00:00").toLocaleDateString("de-DE", { day: "numeric", month: "short", year: "numeric" })}
        </p>
      </div>
      {renderSection("Kurse", courseItems, "bg-blue-500", "bg-blue-50")}
      {renderSection("Rental", rentalItems, "bg-orange-500", "bg-orange-50")}
    </div>
  );
}

function CustomersTab({ schoolConfigId }: { schoolConfigId: number }) {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
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

  function isCurrentlyHere(arrival: string, departure: string): boolean {
    const today = new Date().toISOString().slice(0, 10);
    return arrival <= today && today <= departure;
  }

  const filtered = useMemo(() => {
    let list = customers;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
      );
    }
    if (activeOnly) {
      list = list.filter(c => isCurrentlyHere(c.arrivalDate, c.departureDate));
    }
    return list;
  }, [customers, search, activeOnly]);

  const createMutation = useMutation({
    mutationFn: (data: object) => apiRequest("POST", "/api/school-customers", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/school-customers", schoolConfigId] });
      setShowForm(false);
      resetForm();
      toast({ title: "Kunde registriert" });
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: object }) => apiRequest("PATCH", `/api/school-customers/${id}`, data),
    onSuccess: async (res) => {
      const updated = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/school-customers", schoolConfigId] });
      setSelectedCustomer(updated);
      setEditMode(false);
      toast({ title: "Kunde aktualisiert" });
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/school-customers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/school-customers", schoolConfigId] });
      setSelectedCustomer(null);
      toast({ title: "Kunde gelöscht" });
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
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
    return (
      <div className="p-4 max-w-2xl mx-auto space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setSelectedCustomer(null)} data-testid="btn-back">
          <ArrowLeft className="h-4 w-4 mr-1" /> Zurück
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
      </div>
    );
  }

  if (selectedCustomer && editMode) {
    return (
      <div className="p-4 max-w-2xl mx-auto space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setEditMode(false)} data-testid="btn-cancel-edit">
          <ArrowLeft className="h-4 w-4 mr-1" /> Abbrechen
        </Button>
        <Card>
          <CardContent className="p-4 space-y-4">
            <p className="text-lg font-bold">Kunde bearbeiten</p>
            {formFields}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditMode(false)}>Abbrechen</Button>
              <Button data-testid="btn-save-customer" disabled={!isFormValid || updateMutation.isPending} onClick={handleSubmitEdit}>
                Speichern
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">{filtered.length} Kunden</p>
        <Button size="sm" onClick={openCreate} data-testid="btn-add-customer">
          <Plus className="h-4 w-4 mr-1" /> Gast registrieren
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            data-testid="input-search-customers"
            className="pl-9"
            placeholder="Name oder E-Mail suchen..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={activeOnly} onCheckedChange={setActiveOnly} data-testid="toggle-active-only" />
          <span className="text-xs text-muted-foreground whitespace-nowrap">Aktive</span>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">{search || activeOnly ? "Keine passenden Kunden." : "Noch keine Kunden registriert."}</p>
      ) : (
        <div className="space-y-1">
          {filtered.map(c => {
            const here = isCurrentlyHere(c.arrivalDate, c.departureDate);
            return (
              <div
                key={c.id}
                data-testid={`row-customer-${c.id}`}
                onClick={() => { setSelectedCustomer(c); setEditMode(false); }}
                className="flex items-center gap-3 px-3 py-3 rounded-lg border bg-card hover:bg-accent/30 cursor-pointer transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{c.firstName} {c.lastName}</p>
                  <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Badge variant={c.guestType === "KiteWorldWide" ? "default" : "secondary"} className="text-[10px]">
                    {c.guestType === "KiteWorldWide" ? "KWW" : "Walk-in"}
                  </Badge>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${KITE_LEVEL_COLORS[c.kiteLevel]}`}>{c.kiteLevel}</span>
                  {here && <Badge variant="outline" className="text-[10px] text-green-700 border-green-300 bg-green-50 dark:bg-green-900/20 dark:text-green-400">Here</Badge>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gast registrieren</DialogTitle>
          </DialogHeader>
          {formFields}
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>Abbrechen</Button>
            <Button data-testid="btn-submit-customer" disabled={!isFormValid || createMutation.isPending} onClick={handleSubmitCreate}>
              Registrieren
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
