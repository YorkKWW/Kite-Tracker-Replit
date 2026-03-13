import { useState, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileSpreadsheet, Loader2, Building2, Image, MapPin, Users, FileText, MessageSquarePlus, ChevronRight } from "lucide-react";
import type { CompanySettings } from "@shared/schema";

export default function SettingsPage() {
  const { user, isAdmin, isSuperAdmin } = useAuth();
  const { toast } = useToast();

  const { data: feedbackCountData } = useQuery<{ count: number }>({
    queryKey: ["/api/feedback/open-count"],
    staleTime: 0,
    enabled: isAdmin,
  });
  const fileRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const { data: companyData, isLoading: loadingCompany } = useQuery<CompanySettings>({
    queryKey: ["/api/company-settings"],
    enabled: isAdmin,
  });

  const [company, setCompany] = useState<Partial<CompanySettings>>({});

  const companyValues = { ...companyData, ...company };

  const updateCompanyMutation = useMutation({
    mutationFn: () => apiRequest("PUT", "/api/company-settings", companyValues).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/company-settings"] });
      setCompany({});
      toast({ title: "Company details saved" });
    },
    onError: (e: any) => toast({ title: "Save failed", description: e.message, variant: "destructive" }),
  });

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/equipment/import", { method: "POST", body: formData, credentials: "include" });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message); }
      const result = await res.json();
      setImportResult(result);
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      toast({ title: `Imported ${result.imported} items` });
    } catch (err: any) {
      toast({ title: "Import failed", description: err.message, variant: "destructive" });
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("logo", file);
      const res = await fetch("/api/company-settings/logo", { method: "POST", body: formData, credentials: "include" });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message); }
      queryClient.invalidateQueries({ queryKey: ["/api/company-settings"] });
      toast({ title: "Logo uploaded" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploadingLogo(false);
      if (logoRef.current) logoRef.current.value = "";
    }
  };

  const field = (key: keyof CompanySettings, label: string, placeholder?: string) => (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input
        value={(companyValues[key] as string) ?? ""}
        onChange={(e) => setCompany((prev) => ({ ...prev, [key]: e.target.value }))}
        placeholder={placeholder}
        data-testid={`input-company-${key}`}
        disabled={loadingCompany}
      />
    </div>
  );

  const adminLinks = [
    ...(isAdmin ? [{ href: "/stations", label: "Locations", icon: MapPin, description: "Manage stations & locations" }] : []),
    ...(isAdmin ? [{ href: "/users", label: "Users", icon: Users, description: "Manage user accounts & roles" }] : []),
    { href: "/activity", label: "Activity Log", icon: FileText, description: "View system activity & audit trail" },
    { href: "/feedback", label: "Feedback & Bug Reports", icon: MessageSquarePlus, description: isAdmin ? "Review user feedback" : "Dein Feedback anzeigen", badge: isAdmin ? feedbackCountData?.count : undefined },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold tracking-tight" data-testid="text-settings-title">Settings</h1>

      <Card>
        <CardContent className="p-0 divide-y">
          {adminLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <button className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/50 transition-colors" data-testid={`link-settings-${link.label.toLowerCase().replace(/\s+/g, "-")}`}>
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <link.icon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{link.label}</p>
                    {link.badge && link.badge > 0 ? (
                      <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold">{link.badge}</span>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground">{link.description}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </button>
            </Link>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><h2 className="font-semibold">Account</h2></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Name</p>
              <p className="font-medium" data-testid="text-account-name">{user?.name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="font-medium" data-testid="text-account-email">{user?.email}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Role</p>
              <p className="font-medium capitalize">{isSuperAdmin ? "Super Admin" : user?.role === "admin" ? "Admin" : user?.role === "manager" ? "Hamburg Manager" : "Station Lead"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {isAdmin && (
        <>
          <Card>
            <CardHeader className="pb-2">
              <h2 className="font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4" /> Company Details
              </h2>
              <p className="text-xs text-muted-foreground">Shown on every sales invoice (required for German GmbH)</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingCompany ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {field("companyName", "Company Name", "KiteWorldWide GmbH")}
                    {field("managingDirector", "Managing Director", "York Neumann")}
                    {field("address", "Address", "Steindamm 97, D-20099 Hamburg")}
                    {field("phone", "Phone", "+49 40 2093 45090")}
                    {field("website", "Website", "www.kiteworldwide.com")}
                    {field("registry", "Registry", "Amtsgericht Hamburg, HRB 105108")}
                    {field("taxId", "Tax ID (St-Nr.)", "46/736/04728")}
                    {field("vatId", "VAT ID (USt-IdNr.)", "DE259606444")}
                  </div>

                  <div className="border-t pt-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Bank Details</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {field("bankName", "Bank Name", "Commerzbank")}
                      {field("iban", "IBAN", "DE69 2004 0000 0898 2100 00")}
                      {field("bic", "BIC", "COBADEFFXXX")}
                      {field("accountHolder", "Account Holder", "KiteWorldWide GmbH")}
                    </div>
                  </div>

                  <div className="border-t pt-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Invoice Settings</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {field("invoicePrefix", "Invoice Prefix", "Inv-KWS")}
                      <div className="space-y-1.5">
                        <Label className="text-xs">Next Invoice Number</Label>
                        <Input
                          type="number"
                          value={(companyValues.invoiceNextNumber as number) ?? 1001}
                          onChange={(e) => setCompany((prev) => ({ ...prev, invoiceNextNumber: parseInt(e.target.value) }))}
                          data-testid="input-company-invoiceNextNumber"
                          disabled={loadingCompany}
                        />
                      </div>
                      {field("paypalEmail", "PayPal Email (optional)", "paypal@example.com")}
                    </div>
                  </div>

                  <div className="border-t pt-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Company Logo</p>
                    <div className="flex items-center gap-4">
                      {companyData?.logoUrl && (
                        <img src={companyData.logoUrl} alt="Company logo" className="h-16 object-contain border rounded" data-testid="img-company-logo" />
                      )}
                      <Label
                        htmlFor="logo-upload"
                        className="flex items-center gap-2 px-4 py-2 border rounded-md cursor-pointer text-sm text-muted-foreground hover:bg-muted transition-colors"
                        data-testid="button-upload-logo"
                      >
                        {uploadingLogo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Image className="h-4 w-4" />}
                        {companyData?.logoUrl ? "Replace Logo" : "Upload Logo"}
                      </Label>
                      <input ref={logoRef} id="logo-upload" type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploadingLogo} />
                    </div>
                  </div>

                  <Button
                    onClick={() => updateCompanyMutation.mutate()}
                    disabled={updateCompanyMutation.isPending}
                    className="w-full"
                    data-testid="button-save-company"
                  >
                    {updateCompanyMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Company Details
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <h2 className="font-semibold flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4" /> Import Equipment from CSV
              </h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Upload a CSV file with columns: serial_number, type, brand, model, year, station_id, condition, notes, purchase_price, current_value
              </p>
              <div>
                <Label htmlFor="csv-import" className="flex items-center justify-center gap-2 p-6 border-2 border-dashed rounded-md cursor-pointer text-muted-foreground transition-colors">
                  {importing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                  <span className="text-sm">{importing ? "Importing..." : "Select CSV file"}</span>
                </Label>
                <input ref={fileRef} id="csv-import" type="file" accept=".csv" className="hidden" onChange={handleImport} disabled={importing} data-testid="input-csv-import" />
              </div>
              {importResult && (
                <div className="p-4 rounded-md bg-muted/50 space-y-2">
                  <p className="text-sm font-medium">Import Results</p>
                  <div className="flex gap-4 text-sm">
                    <span className="text-green-600 dark:text-green-400">Imported: {importResult.imported}</span>
                    <span className="text-muted-foreground">Skipped: {importResult.skipped}</span>
                  </div>
                  {importResult.errors.length > 0 && (
                    <div className="text-xs text-destructive space-y-1 mt-2">
                      {importResult.errors.map((err, i) => <p key={i}>{err}</p>)}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
