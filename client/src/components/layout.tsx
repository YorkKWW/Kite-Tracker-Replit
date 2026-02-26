import { type ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BarcodeScanner } from "@/components/barcode-scanner";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout, isAdmin, isHamburg, isStationLead } = useAuth();
  const [location, navigate] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);

  const handleScan = async (code: string) => {
    try {
      const res = await fetch(`/api/equipment/scan?serial=${encodeURIComponent(code)}`, { credentials: "include" });
      if (res.ok) {
        const item = await res.json();
        navigate(`/equipment/${item.id}`);
      } else {
        navigate(`/equipment/new?serial=${encodeURIComponent(code)}`);
      }
    } catch {
      navigate(`/equipment/new?serial=${encodeURIComponent(code)}`);
    }
  };

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/equipment", label: "Equipment", icon: Package },
    ...(isHamburg ? [{ href: "/transfers", label: "Transfers", icon: ArrowLeftRight }] : []),
    { href: "/sales", label: "Sales", icon: ShoppingCart },
    { href: "/incidents", label: "Incidents", icon: AlertTriangle },
    { href: "/repairs", label: "Repairs", icon: Wrench },
    ...(isHamburg
      ? [
          { href: "/price-lists", label: "Price Lists", icon: Tag },
          { href: "/invoice-import", label: "Import Invoice", icon: FileUp },
        ]
      : []),
    ...(isAdmin
      ? [
          { href: "/stations", label: "Locations", icon: MapPin },
          { href: "/users", label: "Users", icon: Users },
        ]
      : []),
    { href: "/activity", label: "Activity", icon: FileText },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

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
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {mobileMenuOpen && (
          <nav className="md:hidden border-t bg-background p-2 space-y-1">
            {navItems.map((item) => (
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
          </nav>
        )}
      </header>

      <BarcodeScanner open={scannerOpen} onClose={() => setScannerOpen(false)} onScan={handleScan} />

      <main className="pb-20 md:pb-6">{children}</main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.slice(0, 4).map((item) => (
            <Link key={item.href} href={item.href}>
              <button
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-2 rounded-md transition-colors min-w-[60px]",
                  isActive(item.href) ? "text-primary" : "text-muted-foreground"
                )}
                data-testid={`link-bottom-nav-${item.label.toLowerCase()}`}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
