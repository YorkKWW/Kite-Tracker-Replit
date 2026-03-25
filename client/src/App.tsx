import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import Layout from "@/components/layout";
import LoginPage from "@/pages/login";
import ForgotPasswordPage from "@/pages/forgot-password";
import ResetPasswordPage from "@/pages/reset-password";
import DashboardPage from "@/pages/dashboard";
import EquipmentListPage from "@/pages/equipment-list";
import EquipmentDetailPage from "@/pages/equipment-detail";
import EquipmentFormPage from "@/pages/equipment-form";
import AccessoriesPage from "@/pages/accessories";
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
import IncidentsPage from "@/pages/incidents";
import RepairsPage from "@/pages/repairs";
import SettingsPage from "@/pages/settings";
import FeedbackAdminPage from "@/pages/feedback-admin";
import SchoolAdminPage from "@/pages/school-admin";
import SchoolCustomersPage from "@/pages/school-customers";
import BookingsPage from "@/pages/bookings";
import CenterPage from "@/pages/center";
import QuickInventoryPage from "@/pages/quick-inventory";
import NotFound from "@/pages/not-found";
import { Loader2 } from "lucide-react";

function RedirectToCenter() {
  return <Redirect to="/center" />;
}

function AuthenticatedRouter() {
  const { user, isLoading, isAdmin, isHamburg, isStationLead } = useAuth();
  const path = window.location.pathname;

  // Public routes — accessible without login
  if (path === "/forgot-password") return <ForgotPasswordPage />;
  if (path === "/reset-password") return <ResetPasswordPage />;

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
        {isHamburg && <Route path="/equipment/new" component={EquipmentFormPage} />}
        <Route path="/equipment/:id" component={EquipmentDetailPage} />
        <Route path="/accessories" component={AccessoriesPage} />
        <Route path="/transfers" component={TransfersPage} />
        {isAdmin && <Route path="/stations" component={StationsPage} />}
        <Route path="/stations/:id" component={StationDetailPage} />
        <Route path="/inventory-check/:id" component={InventoryCheckPage} />
        <Route path="/quick-inventory" component={QuickInventoryPage} />
        {isAdmin && <Route path="/users" component={UsersPage} />}
        <Route path="/feedback" component={FeedbackAdminPage} />
        <Route path="/activity" component={ActivityPage} />
        <Route path="/incidents" component={isStationLead ? RedirectToCenter : IncidentsPage} />
        <Route path="/repairs" component={RepairsPage} />
        {isHamburg && <Route path="/invoice-import" component={InvoiceImportPage} />}
        {isHamburg && <Route path="/price-lists" component={PriceListsPage} />}
        {isAdmin && <Route path="/school-admin" component={SchoolAdminPage} />}
        <Route path="/center" component={CenterPage} />
        <Route path="/customers" component={isStationLead ? RedirectToCenter : SchoolCustomersPage} />
        <Route path="/bookings" component={isStationLead ? RedirectToCenter : BookingsPage} />
        <Route path="/sales/new" component={SaleCreatePage} />
        <Route path="/sales" component={isStationLead ? RedirectToCenter : SalesPage} />
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
