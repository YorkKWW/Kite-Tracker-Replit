import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  FileText, Package, Star, Wrench, ArrowLeftRight, UserPlus, MapPin,
  Camera, ShoppingCart, ClipboardList, LogIn, X, Filter, AlertTriangle, Receipt,
  Upload, Settings, Users, Trash2, MessageSquare, List, UserMinus, ImageMinus
} from "lucide-react";
import type { Station, User } from "@shared/schema";

type ActivityEntry = {
  id: number;
  userId: number;
  action: string;
  equipmentId: number | null;
  details: string | null;
  timestamp: string | null;
  userName: string;
  equipmentLabel?: string;
};

const ACTION_ICONS: Record<string, React.ReactNode> = {
  equipment_created: <Package className="h-4 w-4 text-primary" />,
  equipment_updated: <Package className="h-4 w-4 text-blue-500" />,
  equipment_deleted: <Package className="h-4 w-4 text-destructive" />,
  equipment_status_changed: <Package className="h-4 w-4 text-orange-500" />,
  condition_rated: <Star className="h-4 w-4 text-yellow-500" />,
  repair_logged: <Wrench className="h-4 w-4 text-orange-500" />,
  transfer_initiated: <ArrowLeftRight className="h-4 w-4 text-purple-500" />,
  transfer_confirmed: <ArrowLeftRight className="h-4 w-4 text-green-500" />,
  transfer_item_missing: <AlertTriangle className="h-4 w-4 text-red-500" />,
  damage_reported: <AlertTriangle className="h-4 w-4 text-red-600" />,
  spare_parts_needed: <Wrench className="h-4 w-4 text-orange-500" />,
  user_created: <UserPlus className="h-4 w-4 text-blue-500" />,
  user_login: <LogIn className="h-4 w-4 text-muted-foreground" />,
  station_created: <MapPin className="h-4 w-4 text-emerald-500" />,
  photo_added: <Camera className="h-4 w-4 text-sky-500" />,
  sale_created: <ShoppingCart className="h-4 w-4 text-violet-500" />,
  sale_confirmed: <ShoppingCart className="h-4 w-4 text-green-600" />,
  inventory_check_started: <ClipboardList className="h-4 w-4 text-amber-500" />,
  inventory_check_completed: <ClipboardList className="h-4 w-4 text-green-500" />,
  invoice_import: <Receipt className="h-4 w-4 text-teal-500" />,
  invoice_deleted: <Trash2 className="h-4 w-4 text-red-500" />,
  equipment_csv_import: <Upload className="h-4 w-4 text-teal-500" />,
  station_updated: <MapPin className="h-4 w-4 text-blue-500" />,
  station_deleted: <Trash2 className="h-4 w-4 text-red-500" />,
  user_updated: <Users className="h-4 w-4 text-blue-500" />,
  user_deleted: <UserMinus className="h-4 w-4 text-red-500" />,
  repair_updated: <Wrench className="h-4 w-4 text-blue-500" />,
  transfer_cancelled: <ArrowLeftRight className="h-4 w-4 text-red-400" />,
  photo_deleted: <ImageMinus className="h-4 w-4 text-red-400" />,
  settings_updated: <Settings className="h-4 w-4 text-gray-500" />,
  customer_created: <Users className="h-4 w-4 text-emerald-500" />,
  customer_updated: <Users className="h-4 w-4 text-blue-500" />,
  price_list_created: <List className="h-4 w-4 text-teal-500" />,
  price_list_updated: <List className="h-4 w-4 text-blue-500" />,
  price_list_deleted: <Trash2 className="h-4 w-4 text-red-500" />,
  damage_status_changed: <AlertTriangle className="h-4 w-4 text-orange-500" />,
  damage_photo_added: <Camera className="h-4 w-4 text-red-400" />,
  feedback_submitted: <MessageSquare className="h-4 w-4 text-blue-500" />,
  feedback_updated: <MessageSquare className="h-4 w-4 text-gray-500" />,
  inventory_item_checked: <ClipboardList className="h-4 w-4 text-blue-500" />,
};

const ACTION_LABELS: Record<string, string> = {
  equipment_created: "Equipment Added",
  equipment_updated: "Equipment Updated",
  equipment_deleted: "Equipment Deleted",
  equipment_status_changed: "Status Changed",
  condition_rated: "Condition Rated",
  repair_logged: "Repair Logged",
  transfer_initiated: "Transfer Initiated",
  transfer_confirmed: "Transfer Received",
  transfer_item_missing: "Item Reported Missing",
  damage_reported: "Damage Reported",
  spare_parts_needed: "Spare Parts Needed",
  user_created: "User Created",
  user_login: "Login",
  station_created: "Location Created",
  photo_added: "Photo Added",
  sale_created: "Sale Created",
  sale_confirmed: "Sale Confirmed",
  invoice_import: "Invoice Imported",
  invoice_deleted: "Invoice Deleted",
  equipment_csv_import: "CSV Import",
  station_updated: "Location Updated",
  station_deleted: "Location Deleted",
  user_updated: "User Updated",
  user_deleted: "User Deleted",
  repair_updated: "Repair Updated",
  transfer_cancelled: "Transfer Cancelled",
  photo_deleted: "Photo Deleted",
  settings_updated: "Settings Updated",
  customer_created: "Customer Created",
  customer_updated: "Customer Updated",
  price_list_created: "Price List Uploaded",
  price_list_updated: "Price List Updated",
  price_list_deleted: "Price List Deleted",
  damage_status_changed: "Damage Status Changed",
  damage_photo_added: "Damage Photo Added",
  feedback_submitted: "Feedback Submitted",
  feedback_updated: "Feedback Updated",
  inventory_item_checked: "Inventory Item Checked",
  inventory_check_started: "Inventory Check Started",
  inventory_check_completed: "Inventory Check Completed",
  system_seeded: "System Seeded",
};

function formatTime(ts: string | null) {
  if (!ts) return "";
  const d = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }) +
    " " + d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
}

export default function ActivityPage() {
  const { isAdmin, isHamburg } = useAuth();
  const [userId, setUserId] = useState("__all__");
  const [action, setAction] = useState("__all__");
  const [stationId, setStationId] = useState("__all__");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: isAdmin,
  });

  const { data: stations } = useQuery<Station[]>({
    queryKey: ["/api/stations"],
  });

  const params = new URLSearchParams();
  if (userId && userId !== "__all__") params.set("userId", userId);
  if (action && action !== "__all__") params.set("action", action);
  if (stationId && stationId !== "__all__") params.set("stationId", stationId);
  if (dateFrom) params.set("dateFrom", new Date(dateFrom).toISOString());
  if (dateTo) {
    const d = new Date(dateTo);
    d.setHours(23, 59, 59, 999);
    params.set("dateTo", d.toISOString());
  }
  params.set("limit", "200");

  const queryString = params.toString();
  const { data: logs, isLoading } = useQuery<ActivityEntry[]>({
    queryKey: ["/api/activity", queryString],
    queryFn: async () => {
      const res = await fetch(`/api/activity?${queryString}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    staleTime: 0,
  });

  const hasFilters = (userId && userId !== "__all__") || (action && action !== "__all__") || (stationId && stationId !== "__all__") || dateFrom || dateTo;

  function clearFilters() {
    setUserId("__all__");
    setAction("__all__");
    setStationId("__all__");
    setDateFrom("");
    setDateTo("");
  }

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-activity-title">Activity Log</h1>
        <div className="flex items-center gap-2">
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} data-testid="button-clear-filters">
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setShowFilters(f => !f)} data-testid="button-toggle-filters">
            <Filter className="h-4 w-4 mr-1.5" />
            Filters {hasFilters ? `(${[userId !== "__all__" && userId, action !== "__all__" && action, stationId !== "__all__" && stationId, dateFrom, dateTo].filter(Boolean).length})` : ""}
          </Button>
        </div>
      </div>

      {showFilters && (
        <Card>
          <CardContent className="p-4 grid grid-cols-2 md:grid-cols-3 gap-3">
            {isAdmin && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">User</p>
                <Select value={userId} onValueChange={setUserId} data-testid="select-filter-user">
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="All users" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All users</SelectItem>
                    {users?.map(u => <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Action type</p>
              <Select value={action} onValueChange={setAction} data-testid="select-filter-action">
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All actions</SelectItem>
                  {Object.entries(ACTION_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {isHamburg && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Location</p>
                <Select value={stationId} onValueChange={setStationId} data-testid="select-filter-station">
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="All locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All locations</SelectItem>
                    {stations?.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">From date</p>
              <Input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="h-8 text-sm"
                data-testid="input-filter-date-from"
              />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">To date</p>
              <Input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="h-8 text-sm"
                data-testid="input-filter-date-to"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-16" />)}
        </div>
      ) : !logs?.length ? (
        <div className="text-center py-16">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="font-medium">No activity found</h3>
          {hasFilters && <p className="text-sm text-muted-foreground mt-1">Try adjusting the filters</p>}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left p-3 font-medium text-muted-foreground w-8"></th>
                <th className="text-left p-3 font-medium text-muted-foreground">What happened</th>
                <th className="text-left p-3 font-medium text-muted-foreground hidden sm:table-cell">Who</th>
                <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Equipment</th>
                <th className="text-right p-3 font-medium text-muted-foreground whitespace-nowrap">When</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, idx) => (
                <tr
                  key={log.id}
                  className={`border-b last:border-0 hover:bg-muted/20 transition-colors ${idx % 2 === 0 ? "" : "bg-muted/5"}`}
                  data-testid={`row-activity-${log.id}`}
                >
                  <td className="p-3">
                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-muted/50">
                      {ACTION_ICONS[log.action] || <FileText className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </td>
                  <td className="p-3">
                    <p className="font-medium">{log.details || ACTION_LABELS[log.action] || log.action}</p>
                    <p className="text-xs text-muted-foreground sm:hidden">{log.userName}</p>
                  </td>
                  <td className="p-3 hidden sm:table-cell">
                    <span className="text-muted-foreground">{log.userName}</span>
                  </td>
                  <td className="p-3 hidden md:table-cell">
                    {log.equipmentId && log.equipmentLabel ? (
                      <Link href={`/equipment/${log.equipmentId}`}>
                        <span className="text-primary hover:underline cursor-pointer">{log.equipmentLabel}</span>
                      </Link>
                    ) : (
                      <span className="text-muted-foreground/50">—</span>
                    )}
                  </td>
                  <td className="p-3 text-right whitespace-nowrap text-muted-foreground text-xs">
                    {formatTime(log.timestamp)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
