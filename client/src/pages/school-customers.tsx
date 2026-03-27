import { useState, useMemo } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Users, Plus, Search, ArrowLeft, Pencil, Trash2, Calendar } from "lucide-react";
import type { SchoolCustomer } from "@shared/schema";

const KITE_LEVEL_COLORS: Record<string, string> = {
  Beginner: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  Intermediate: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  Advanced: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  Pro: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  Nonkite: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

type SchoolConfigItem = { id: number; stationId: number; schoolName: string; currency: string; isActive: boolean; stationName: string };

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

function isCurrentlyHere(arrival: string, departure: string): boolean {
  const today = new Date().toISOString().slice(0, 10);
  return arrival <= today && today <= departure;
}

export default function SchoolCustomersPage() {
  const { isAdmin, isStationLead } = useAuth();
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

  const { data: schoolConfigs = [] } = useQuery<SchoolConfigItem[]>({ queryKey: ["/api/school-configs"] });
  const activeSchool = schoolConfigs.find(c => c.isActive);

  const { data: customers = [], isLoading } = useQuery<SchoolCustomer[]>({
    queryKey: ["/api/school-customers", activeSchool?.id],
    enabled: !!activeSchool,
  });

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
      queryClient.invalidateQueries({ queryKey: ["/api/school-customers", activeSchool?.id] });
      setShowForm(false);
      resetForm();
      toast({ title: "Customer registered" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: object }) => apiRequest("PATCH", `/api/school-customers/${id}`, data),
    onSuccess: async (res) => {
      const updated = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/school-customers", activeSchool?.id] });
      setSelectedCustomer(updated);
      setEditMode(false);
      toast({ title: "Customer updated" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/school-customers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/school-customers", activeSchool?.id] });
      setSelectedCustomer(null);
      toast({ title: "Customer deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
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

  function openDetail(c: SchoolCustomer) {
    setSelectedCustomer(c);
    setEditMode(false);
  }

  function startEdit() {
    if (!selectedCustomer) return;
    setGuestType((selectedCustomer as any).guestType ?? "Walk-in");
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
    if (!activeSchool) return;
    createMutation.mutate({
      schoolConfigId: activeSchool.id,
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

  if (!isAdmin && !isStationLead) {
    return <div className="p-8 text-center text-muted-foreground">Access denied.</div>;
  }

  const formFields = (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Guest Type</p>
        <div className="flex gap-2">
          <button
            type="button"
            data-testid="btn-guest-type-kww"
            onClick={() => setGuestType("KiteWorldWide")}
            className={`flex-1 py-2.5 px-3 rounded-lg border text-sm font-medium transition-colors ${
              guestType === "KiteWorldWide"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border text-muted-foreground hover:bg-accent/50"
            }`}
          >
            KiteWorldWide
          </button>
          <button
            type="button"
            data-testid="btn-guest-type-walkin"
            onClick={() => setGuestType("Walk-in")}
            className={`flex-1 py-2.5 px-3 rounded-lg border text-sm font-medium transition-colors ${
              guestType === "Walk-in"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border text-muted-foreground hover:bg-accent/50"
            }`}
          >
            Walk-in
          </button>
        </div>
        {guestType === "KiteWorldWide" && (
          <p className="text-[11px] text-muted-foreground mt-1.5">Pre-booked guest — billing via KiteWorldWide ERP</p>
        )}
        {guestType === "Walk-in" && (
          <p className="text-[11px] text-muted-foreground mt-1.5">Direct booking — billed on-site at the center</p>
        )}
      </div>

      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Personal Info</p>
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
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div className="space-y-1">
            <Label className="text-xs">Email *</Label>
            <Input data-testid="input-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="guest@email.com" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Phone *</Label>
            <Input data-testid="input-phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+49 170 1234567" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3">
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
      </div>

      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Kite Info</p>
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
        <div className="mt-3 space-y-1">
          <Label className="text-xs">Emergency Contact *</Label>
          <Input data-testid="input-emergency" value={emergencyContact} onChange={e => setEmergencyContact(e.target.value)} placeholder="Hans Müller +49 170 9876543" />
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Stay</p>
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
      </div>

      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Notes</p>
        <Textarea data-testid="input-notes" rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any additional info..." />
      </div>
    </div>
  );

  if (selectedCustomer && !editMode) {
    const c = selectedCustomer;
    const here = isCurrentlyHere(c.arrivalDate, c.departureDate);
    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
        <Button variant="ghost" size="sm" onClick={() => setSelectedCustomer(null)} data-testid="btn-back">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to list
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg" data-testid="text-customer-name">{c.firstName} {c.lastName}</CardTitle>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge variant={(c as any).guestType === "KiteWorldWide" ? "default" : "secondary"} className="text-xs" data-testid="badge-guest-type">
                    {(c as any).guestType === "KiteWorldWide" ? "KiteWorldWide" : "Walk-in"}
                  </Badge>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${KITE_LEVEL_COLORS[c.kiteLevel]}`}>{c.kiteLevel}</span>
                  {here && <Badge variant="outline" className="text-xs text-green-700 border-green-300 bg-green-50 dark:bg-green-900/20 dark:text-green-400">Currently here</Badge>}
                </div>
              </div>
              <div className="flex gap-2">
                {isAdmin && (
                  <>
                    <Button variant="outline" size="sm" onClick={startEdit} data-testid="btn-edit-customer"><Pencil className="h-3 w-3 mr-1" /> Edit</Button>
                    <Button variant="destructive" size="sm" onClick={() => { if (confirm("Delete this customer?")) deleteMutation.mutate(c.id); }} data-testid="btn-delete-customer"><Trash2 className="h-3 w-3" /></Button>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
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

            <div className="pt-4 border-t">
              <h3 className="font-medium text-sm mb-2">Billing History</h3>
              <p className="text-sm text-muted-foreground">No billing history yet.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (selectedCustomer && editMode) {
    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
        <Button variant="ghost" size="sm" onClick={() => setEditMode(false)} data-testid="btn-cancel-edit">
          <ArrowLeft className="h-4 w-4 mr-1" /> Cancel
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Edit Customer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {formFields}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditMode(false)}>Cancel</Button>
              <Button data-testid="btn-save-customer" disabled={!isFormValid || updateMutation.isPending} onClick={handleSubmitEdit}>
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-xl font-bold" data-testid="text-page-title">Customers</h1>
            <p className="text-xs text-muted-foreground">{activeSchool?.schoolName ?? "No active school"}</p>
          </div>
        </div>
        <Button size="sm" onClick={openCreate} data-testid="btn-add-customer">
          <Plus className="h-4 w-4 mr-1" /> Register Guest
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            data-testid="input-search"
            className="pl-9"
            placeholder="Search name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={activeOnly} onCheckedChange={setActiveOnly} data-testid="toggle-active-only" />
          <span className="text-xs text-muted-foreground whitespace-nowrap">Active guests only</span>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
      ) : !activeSchool ? (
        <p className="text-sm text-muted-foreground py-8 text-center">No active school configured. Set up a school in Settings first.</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">{search || activeOnly ? "No matching customers." : "No customers registered yet."}</p>
      ) : (
        <div className="space-y-1">
          <div className="hidden md:grid grid-cols-[1fr_90px_1fr_100px_80px_80px_80px_80px] gap-2 px-3 py-2 text-xs font-medium text-muted-foreground border-b">
            <span>Name</span><span>Type</span><span>Email</span><span>Level</span><span>Nationality</span><span>Arrival</span><span>Departure</span><span>Status</span>
          </div>
          {filtered.map(c => {
            const here = isCurrentlyHere(c.arrivalDate, c.departureDate);
            return (
              <div
                key={c.id}
                data-testid={`row-customer-${c.id}`}
                onClick={() => openDetail(c)}
                className="grid grid-cols-[1fr_auto] md:grid-cols-[1fr_90px_1fr_100px_80px_80px_80px_80px] gap-2 px-3 py-3 rounded-lg border bg-card hover:bg-accent/30 cursor-pointer transition-colors items-center"
              >
                <span className="font-medium text-sm">{c.firstName} {c.lastName}</span>
                <span className="hidden md:block">
                  <Badge variant={(c as any).guestType === "KiteWorldWide" ? "default" : "secondary"} className="text-[10px]">
                    {(c as any).guestType === "KiteWorldWide" ? "KWW" : "Walk-in"}
                  </Badge>
                </span>
                <span className="text-sm text-muted-foreground hidden md:block truncate">{c.email}</span>
                <span className="hidden md:block"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${KITE_LEVEL_COLORS[c.kiteLevel]}`}>{c.kiteLevel}</span></span>
                <span className="text-xs text-muted-foreground hidden md:block">{c.nationality}</span>
                <span className="text-xs hidden md:block">{c.arrivalDate.slice(5)}</span>
                <span className="text-xs hidden md:block">{c.departureDate.slice(5)}</span>
                <span className="md:hidden flex items-center gap-2 flex-wrap">
                  <Badge variant={(c as any).guestType === "KiteWorldWide" ? "default" : "secondary"} className="text-[10px]">
                    {(c as any).guestType === "KiteWorldWide" ? "KWW" : "Walk-in"}
                  </Badge>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${KITE_LEVEL_COLORS[c.kiteLevel]}`}>{c.kiteLevel}</span>
                  {here && <Badge variant="outline" className="text-[10px] text-green-700 border-green-300 bg-green-50 dark:bg-green-900/20 dark:text-green-400">Here</Badge>}
                </span>
                <span className="hidden md:block">
                  {here ? <Badge variant="outline" className="text-[10px] text-green-700 border-green-300 bg-green-50 dark:bg-green-900/20 dark:text-green-400">Here</Badge> : <span className="text-[10px] text-muted-foreground">—</span>}
                </span>
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
