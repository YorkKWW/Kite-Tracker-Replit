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
  Bell,
  Eye,
  EyeOff,
  Shirt as ShirtIcon,
} from "lucide-react";
import type { ViewMode } from "@/lib/auth";
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
  const { user, logout, isAdmin, isHamburg, isStationLead, isSuperAdmin, viewMode, setViewMode, isSimulating } = useAuth();
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
        brand: quickBrand || "Unknown",
        model: "Unknown",
        currentStationId: 7,
        status: "active",
        conditionRating: 3,
        yearOfPurchase: new Date().getFullYear(),
      }),
    onSuccess: async (res) => {
      const newItem = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      toast({ title: "Quick Entry", description: `${quickBrand || "Unknown"} ${EQUIPMENT_TYPE_LABELS[quickType] || quickType} created as "${scanResult?.status === 'not_found' ? scanResult.serial : ''}". Available for editing under "Incoming".` });
      setScanResult(null);
      navigate(`/equipment/${newItem.id}`);
    },
    onError: () => {
      toast({ title: "Error", description: "Equipment could not be created.", variant: "destructive" });
    },
  });

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/equipment", label: "Equipment", icon: Package },
    { href: "/accessories", label: "Accessories", icon: ShirtIcon },
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
    ...(isSuperAdmin ? [{ href: "/feedback", label: "Feedback", icon: MessageSquarePlus }] : []),
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  const stationLeadBottomTabs = [
    { href: "/equipment", label: "Equipment", icon: Package },
    { href: "/accessories", label: "Accessories", icon: ShirtIcon },
    { href: "/incidents", label: "Incidents", icon: AlertTriangle },
    { href: "/repairs", label: "Repairs", icon: Wrench },
    ...(user?.assignedStationId
      ? [{ href: `/stations/${user.assignedStationId}`, label: "Inventory", icon: ClipboardCheck }]
      : []),
  ];

  const defaultBottomTabs = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/equipment", label: "Equipment", icon: Package },
    { href: "/sales", label: "Sales", icon: ShoppingCart },
    { href: "/incidents", label: "Incidents", icon: AlertTriangle },
  ];

  const bottomTabs = isStationLead ? stationLeadBottomTabs : defaultBottomTabs;

  const [notifOpen, setNotifOpen] = useState(false);

  const { data: openCountData } = useQuery<{ count: number }>({
    queryKey: ["/api/damage-reports/open-count"],
    staleTime: 0,
    refetchInterval: 60000,
    enabled: isHamburg || isAdmin,
  });
  const openDamageCount = openCountData?.count ?? 0;

  const { data: unreadNotifData } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread-count"],
    staleTime: 0,
    refetchInterval: 30000,
  });
  const unreadCount = unreadNotifData?.count ?? 0;

  const { data: feedbackCountData } = useQuery<{ count: number }>({
    queryKey: ["/api/feedback/open-count"],
    staleTime: 0,
    refetchInterval: 60000,
    enabled: !!isSuperAdmin,
  });
  const openFeedbackCount = feedbackCountData?.count ?? 0;

  const { data: notifItems } = useQuery<{ id: number; type: string; title: string; message: string; link: string | null; read: boolean; createdAt: string }[]>({
    queryKey: ["/api/notifications"],
    staleTime: 0,
    enabled: notifOpen,
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/notifications/mark-all-read"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (id: number) => apiRequest("PATCH", `/api/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    return location.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-background">
      {isSimulating && (
        <div className="sticky top-0 z-[60] bg-amber-500 text-amber-950 text-center py-1 text-xs font-semibold flex items-center justify-center gap-2" data-testid="banner-simulation">
          <EyeOff className="h-3.5 w-3.5" />
          Simulated View: {viewMode === "admin" ? "Admin" : viewMode === "manager" ? "Hamburg Manager" : "Center Manager"}
          <Button
            variant="ghost"
            size="sm"
            className="h-5 px-2 text-xs text-amber-950 hover:bg-amber-600"
            onClick={() => setViewMode(null)}
            data-testid="button-exit-simulation"
          >
            Exit
          </Button>
        </div>
      )}
      <header className={cn("sticky z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60", isSimulating ? "top-[28px]" : "top-0")}>
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
                  {item.href === "/feedback" && openFeedbackCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center" data-testid="badge-open-feedback">
                      {openFeedbackCount > 9 ? "9+" : openFeedbackCount}
                    </span>
                  )}
                </Button>
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            {user?.isSuperAdmin && (
              <Select
                value={viewMode ?? "super_admin"}
                onValueChange={(v) => setViewMode(v === "super_admin" ? null : v as ViewMode)}
              >
                <SelectTrigger className="h-8 w-auto gap-1 text-xs border-dashed" data-testid="select-view-mode">
                  <Eye className="h-3.5 w-3.5" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Hamburg Manager</SelectItem>
                  <SelectItem value="station_lead">Center Manager</SelectItem>
                </SelectContent>
              </Select>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setScannerOpen(true)}
              title="Scan equipment"
              data-testid="button-scan"
            >
              <ScanLine className="h-5 w-5" />
            </Button>
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setNotifOpen(!notifOpen)}
                data-testid="button-notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-0.5" data-testid="badge-unread-notifications">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Button>
              {notifOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 z-50 w-80 max-h-96 overflow-y-auto rounded-lg border bg-background shadow-lg" data-testid="panel-notifications">
                    <div className="flex items-center justify-between p-3 border-b">
                      <span className="font-semibold text-sm">Notifications</span>
                      {unreadCount > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-7"
                          onClick={() => markAllReadMutation.mutate()}
                          data-testid="button-mark-all-read"
                        >
                          Mark all read
                        </Button>
                      )}
                    </div>
                    {(!notifItems || notifItems.length === 0) && (
                      <div className="p-6 text-center text-sm text-muted-foreground">No notifications</div>
                    )}
                    {notifItems?.map((n) => (
                      <div
                        key={n.id}
                        className={cn(
                          "p-3 border-b last:border-b-0 cursor-pointer hover:bg-muted/50 transition-colors",
                          !n.read && "bg-primary/5"
                        )}
                        onClick={() => {
                          if (!n.read) markReadMutation.mutate(n.id);
                          if (n.link) navigate(n.link);
                          setNotifOpen(false);
                        }}
                        data-testid={`notif-item-${n.id}`}
                      >
                        <div className="flex items-start gap-2">
                          {!n.read && <span className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium leading-tight">{n.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                            <p className="text-[10px] text-muted-foreground mt-1">
                              {new Date(n.createdAt).toLocaleDateString("de-DE")} {new Date(n.createdAt).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
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
                  Equipment Found
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
                    View Details
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setScanResult(null);
                      setScannerOpen(true);
                    }}
                    data-testid="button-scan-again"
                  >
                    Continue Scanning
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
                  Not in Inventory
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3">
                  <p className="text-sm text-amber-800 dark:text-amber-300">
                    The serial number <span className="font-mono font-medium">{scanResult.serial}</span> is not in the system.
                  </p>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-medium">Quick Entry</p>
                  <p className="text-xs text-muted-foreground">The equipment will be parked under &quot;Incoming&quot; and can be completed later in the office.</p>

                  <div className="space-y-2">
                    <Label className="text-xs">Type</Label>
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
                    <Label className="text-xs">Manufacturer</Label>
                    <Input
                      placeholder="e.g. Core, Duotone, North..."
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
                    {quickAddMutation.isPending ? "Creating..." : "Quick Add"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setScanResult(null);
                      navigate(`/equipment/new?serial=${encodeURIComponent(scanResult.serial)}`);
                    }}
                    data-testid="button-full-add"
                  >
                    Full Entry
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
                  Continue Scanning
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
                {item.href === "/feedback" && openFeedbackCount > 0 && (
                  <span className="ml-auto h-5 min-w-[20px] rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center px-1">
                    {openFeedbackCount > 9 ? "9+" : openFeedbackCount}
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
                {item.href === "/feedback" && openFeedbackCount > 0 && (
                  <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {openFeedbackCount > 9 ? "9+" : openFeedbackCount}
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
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
