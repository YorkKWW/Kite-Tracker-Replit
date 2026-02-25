import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import Layout from "@/components/layout";
import LoginPage from "@/pages/login";
import DashboardPage from "@/pages/dashboard";
import EquipmentListPage from "@/pages/equipment-list";
import EquipmentDetailPage from "@/pages/equipment-detail";
import EquipmentFormPage from "@/pages/equipment-form";
import TransfersPage from "@/pages/transfers";
import StationsPage from "@/pages/stations";
import StationDetailPage from "@/pages/station-detail";
import InventoryCheckPage from "@/pages/inventory-check";
import InvoiceImportPage from "@/pages/invoice-import";
import SalesPage from "@/pages/sales";
import SaleCreatePage from "@/pages/sale-create";
import PriceListsPage from "@/pages/price-lists";
import UsersPage from "@/pages/users-page";
import ActivityPage from "@/pages/activity";
import SettingsPage from "@/pages/settings";
import NotFound from "@/pages/not-found";
import { Loader2 } from "lucide-react";

function AuthenticatedRouter() {
  const { user, isLoading, isAdmin } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <Layout>
      <Switch>
        <Route path="/" component={DashboardPage} />
        <Route path="/equipment" component={EquipmentListPage} />
        <Route path="/equipment/new" component={EquipmentFormPage} />
        <Route path="/equipment/:id" component={EquipmentDetailPage} />
        <Route path="/transfers" component={TransfersPage} />
        {isAdmin && <Route path="/stations" component={StationsPage} />}
        <Route path="/stations/:id" component={StationDetailPage} />
        <Route path="/inventory-check/:id" component={InventoryCheckPage} />
        {isAdmin && <Route path="/users" component={UsersPage} />}
        {isAdmin && <Route path="/activity" component={ActivityPage} />}
        {isAdmin && <Route path="/invoice-import" component={InvoiceImportPage} />}
        {isAdmin && <Route path="/price-lists" component={PriceListsPage} />}
        {isAdmin && <Route path="/sales/new" component={SaleCreatePage} />}
        {isAdmin && <Route path="/sales" component={SalesPage} />}
        <Route path="/settings" component={SettingsPage} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <AuthenticatedRouter />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
