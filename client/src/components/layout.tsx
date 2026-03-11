import { type ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  LayoutDashboard,
  Package,
  ArrowLeftRight,
  Settings,
  LogOut,
  Wind,
  Menu,
  X,
  Users,
  MapPin,
  FileText,
  ScanLine,
  FileUp,
  ShoppingCart,
  Tag,
  AlertTriangle,
  Wrench,
  CheckCircle2,
  HelpCircle,
  MessageSquarePlus,
  ClipboardCheck,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BarcodeScanner } from "@/components/barcode-scanner";
import { FeedbackButton } from "@/components/feedback-button";
import { EQUIPMENT_TYPE_LABELS } from "@shared/schema";

interface LayoutProps {
  children: ReactNode;
}

type ScanResult =
  | { status: "found"; id: number; serial: string; brand: string; model: string; type: string }
  | { status: "not_found"; serial: string };

export default function Layout({ children }: LayoutProps) {
  const { user, logout, isAdmin, isHamburg, isStationLead } = useAuth();
  const [location, navigate] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [quickType, setQuickType] = useState("kite");
  const [quickBrand, setQuickBrand] = useState("");
  const { toast } = useToast();

  const handleScan = async (code: string) => {
    try {
      const res = await fetch(`/api/equipment/scan?serial=${encodeURIComponent(code)}`, { credentials: "include" });
      if (res.ok) {
        const item = await res.json();
        setScanResult({
          status: "found",
          id: item.id,
          serial: item.serialNumber,
          brand: item.brand,
          model: item.model,
          type: item.type,
        });
      } else {
        setScanResult({ status: "not_found", serial: code });
        setQuickType("kite");
        setQuickBrand("");
      }
    } catch {
      setScanResult({ status: "not_found", serial: code });
      setQuickType("kite");
      setQuickBrand("");
    }
  };

  const quickAddMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/equipment", {
        serialNumber: scanResult?.status === "not_found" ? scanResult.serial : "",
        type: quickType,
        brand: quickBrand || "Unbekannt",
        model: "Unbekannt",
        currentStationId: 7,
        status: "active",
        conditionRating: 3,
        yearOfPurchase: new Date().getFullYear(),
      }),
    onSuccess: async (res) => {
      const newItem = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      toast({ title: "Schnellerfassung", description: `${quickBrand || "Unbekannt"} ${EQUIPMENT_TYPE_LABELS[quickType] || quickType} als "${scanResult?.status === 'not_found' ? scanResult.serial : ''}" angelegt. Zur Nachbearbeitung unter "Incoming".` });
      setScanResult(null);
      navigate(`/equipment/${newItem.id}`);
    },
    onError: () => {
      toast({ title: "Fehler", description: "Equipment konnte nicht angelegt werden.", variant: "destructive" });
    },
  });

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/equipment", label: "Equipment", icon: Package },
    { href: "/transfers", label: "Transfers", icon: ArrowLeftRight },
    { href: "/sales", label: "Sales", icon: ShoppingCart },
    { href: "/incidents", label: "Incidents", icon: AlertTriangle },
    { href: "/repairs", label: "Repairs", icon: Wrench },
    ...(isHamburg
      ? [
          { href: "/price-lists", label: "Price Lists", icon: Tag },
          { href: "/invoice-import", label: "Import Invoice", icon: FileUp },
        ]
      : []),
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  const stationLeadBottomTabs = [
    { href: "/equipment", label: "Equipment", icon: Package },
    { href: "/incidents", label: "Incidents", icon: AlertTriangle },
    { href: "/repairs", label: "Repairs", icon: Wrench },
    ...(user?.assignedStationId
      ? [{ href: `/stations/${user.assignedStationId}`, label: "Inventur", icon: ClipboardCheck }]
      : []),
  ];

  const defaultBottomTabs = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/equipment", label: "Equipment", icon: Package },
    { href: "/sales", label: "Sales", icon: ShoppingCart },
    { href: "/incidents", label: "Incidents", icon: AlertTriangle },
  ];

  const bottomTabs = isStationLead ? stationLeadBottomTabs : defaultBottomTabs;

  const { data: openCountData } = useQuery<{ count: number }>({
    queryKey: ["/api/damage-reports/open-count"],
    staleTime: 0,
    refetchInterval: 60000,
    enabled: isHamburg || isAdmin,
  });
  const openDamageCount = openCountData?.count ?? 0;

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    return location.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-between gap-1 px-4">
          <div className="flex items-center gap-2">
            <Wind className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg hidden sm:inline" data-testid="text-logo">KiteTracker</span>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive(item.href) ? "secondary" : "ghost"}
                  size="sm"
                  className={cn("gap-2 relative")}
                  data-testid={`link-nav-${item.label.toLowerCase()}`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                  {item.href === "/incidents" && openDamageCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center" data-testid="badge-open-incidents">
                      {openDamageCount > 9 ? "9+" : openDamageCount}
                    </span>
                  )}
                </Button>
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setScannerOpen(true)}
              title="Scan equipment"
              data-testid="button-scan"
            >
              <ScanLine className="h-5 w-5" />
            </Button>
            <span className="text-sm text-muted-foreground hidden sm:inline" data-testid="text-user-info">
              {user?.name} ({user?.role})
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        
      </header>

      <BarcodeScanner open={scannerOpen} onClose={() => setScannerOpen(false)} onScan={handleScan} />

      <Dialog open={!!scanResult} onOpenChange={(o) => { if (!o) setScanResult(null); }}>
        <DialogContent className="max-w-sm" onOpenAutoFocus={(e) => e.preventDefault()}>
          {scanResult?.status === "found" && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Equipment gefunden
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="rounded-md bg-muted p-3 space-y-1">
                  <p className="text-sm font-medium">{scanResult.brand} {scanResult.model}</p>
                  <p className="text-xs text-muted-foreground font-mono">{scanResult.serial}</p>
                  <p className="text-xs text-muted-foreground">{EQUIPMENT_TYPE_LABELS[scanResult.type] || scanResult.type}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={() => {
                      navigate(`/equipment/${scanResult.id}`);
                      setScanResult(null);
                    }}
                    data-testid="button-view-found"
                  >
                    Details anzeigen
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setScanResult(null);
                      setScannerOpen(true);
                    }}
                    data-testid="button-scan-again"
                  >
                    Weiter scannen
                  </Button>
                </div>
              </div>
            </>
          )}

          {scanResult?.status === "not_found" && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base">
                  <HelpCircle className="h-5 w-5 text-amber-500" />
                  Nicht im Bestand
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3">
                  <p className="text-sm text-amber-800 dark:text-amber-300">
                    Die Seriennummer <span className="font-mono font-medium">{scanResult.serial}</span> ist nicht im System.
                  </p>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-medium">Schnellerfassung</p>
                  <p className="text-xs text-muted-foreground">Das Equipment wird unter &quot;Incoming&quot; geparkt und kann später im Büro vervollständigt werden.</p>

                  <div className="space-y-2">
                    <Label className="text-xs">Typ</Label>
                    <Select value={quickType} onValueChange={setQuickType}>
                      <SelectTrigger data-testid="select-quick-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(EQUIPMENT_TYPE_LABELS).map(([val, label]) => (
                          <SelectItem key={val} value={val}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Hersteller</Label>
                    <Input
                      placeholder="z.B. Core, Duotone, North..."
                      value={quickBrand}
                      onChange={(e) => setQuickBrand(e.target.value)}
                      data-testid="input-quick-brand"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={() => quickAddMutation.mutate()}
                    disabled={quickAddMutation.isPending}
                    data-testid="button-quick-add"
                  >
                    {quickAddMutation.isPending ? "Wird angelegt..." : "Schnell anlegen"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setScanResult(null);
                      navigate(`/equipment/new?serial=${encodeURIComponent(scanResult.serial)}`);
                    }}
                    data-testid="button-full-add"
                  >
                    Voll erfassen
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  className="w-full text-xs"
                  onClick={() => {
                    setScanResult(null);
                    setScannerOpen(true);
                  }}
                  data-testid="button-scan-again-notfound"
                >
                  Weiter scannen
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <FeedbackButton />

      <main className="pb-20 md:pb-6">{children}</main>

      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/30" onClick={() => setMobileMenuOpen(false)} />
      )}
      {mobileMenuOpen && (
        <div className="md:hidden fixed bottom-16 left-0 right-0 z-40 bg-background border-t rounded-t-xl shadow-lg p-2 space-y-1 max-h-[60vh] overflow-y-auto safe-area-bottom">
          {navItems
            .filter((item) => !bottomTabs.some((bt) => bt.href === item.href))
            .map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive(item.href) ? "secondary" : "ghost"}
                className="w-full justify-start gap-3 relative"
                onClick={() => setMobileMenuOpen(false)}
                data-testid={`link-mobile-nav-${item.label.toLowerCase()}`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
                {item.href === "/incidents" && openDamageCount > 0 && (
                  <span className="ml-auto h-5 min-w-[20px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1">
                    {openDamageCount > 9 ? "9+" : openDamageCount}
                  </span>
                )}
              </Button>
            </Link>
          ))}
        </div>
      )}

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-around h-16 px-2">
          {bottomTabs.map((item) => (
            <Link key={item.href} href={item.href}>
              <button
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-2 rounded-md transition-colors min-w-[60px] relative",
                  isActive(item.href) ? "text-primary" : "text-muted-foreground"
                )}
                data-testid={`link-bottom-nav-${item.label.toLowerCase()}`}
              >
                <item.icon className="h-5 w-5" />
                {item.href === "/incidents" && openDamageCount > 0 && (
                  <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {openDamageCount > 9 ? "9+" : openDamageCount}
                  </span>
                )}
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            </Link>
          ))}
          <button
            className={cn(
              "flex flex-col items-center gap-1 px-3 py-2 rounded-md transition-colors min-w-[60px]",
              mobileMenuOpen ? "text-primary" : "text-muted-foreground"
            )}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="link-bottom-nav-more"
          >
            <MoreHorizontal className="h-5 w-5" />
            <span className="text-[10px] font-medium">Mehr</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
