import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Users, Pencil, Trash2, Shield, ShieldCheck, ShieldAlert, Check, X } from "lucide-react";
import type { Station } from "@shared/schema";

interface SafeUser {
  id: number;
  name: string;
  email: string;
  role: string;
  assignedStationId: number | null;
  isSuperAdmin?: boolean;
  canEditEquipment?: boolean;
}

function getRoleLabel(u: SafeUser) {
  if (u.role === "admin" && u.isSuperAdmin) return "Super Admin";
  if (u.role === "admin") return "Admin";
  if (u.role === "manager") return "Hamburg Manager";
  return "Station Lead";
}

function getRoleBadgeVariant(u: SafeUser): "default" | "secondary" | "outline" {
  if (u.role === "admin" && u.isSuperAdmin) return "default";
  if (u.role === "admin") return "secondary";
  return "outline";
}

const PERMISSIONS = [
  { label: "Equipment anzeigen", superAdmin: true, admin: true, manager: true, stationLead: true },
  { label: "Equipment anlegen & bearbeiten", superAdmin: true, admin: true, manager: true, stationLead: false },
  { label: "Equipment endgültig löschen", superAdmin: true, admin: false, manager: false, stationLead: false },
  { label: "Einkaufspreise & Werte sehen", superAdmin: true, admin: true, manager: false, stationLead: false },
  { label: "Rechnungen importieren", superAdmin: true, admin: true, manager: true, stationLead: false },
  { label: "Rechnungen löschen", superAdmin: true, admin: false, manager: false, stationLead: false },
  { label: "Transfers starten, bestätigen & stornieren", superAdmin: true, admin: true, manager: true, stationLead: true },
  { label: "Verkäufe erstellen, bestätigen & abschließen", superAdmin: true, admin: true, manager: false, stationLead: true },
  { label: "Preislisten verwalten", superAdmin: true, admin: true, manager: false, stationLead: false },
  { label: "Preislisten einsehen", superAdmin: true, admin: true, manager: true, stationLead: false },
  { label: "Stationen anlegen & bearbeiten", superAdmin: true, admin: true, manager: false, stationLead: false },
  { label: "Stationen löschen", superAdmin: true, admin: false, manager: false, stationLead: false },
  { label: "Manager & Station Leads anlegen & bearbeiten", superAdmin: true, admin: true, manager: false, stationLead: false },
  { label: "Admins anlegen & bearbeiten", superAdmin: true, admin: false, manager: false, stationLead: false },
  { label: "Benutzer löschen", superAdmin: true, admin: false, manager: false, stationLead: false },
  { label: "Benutzer anzeigen", superAdmin: true, admin: true, manager: false, stationLead: false },
  { label: "Damage Reports erstellen", superAdmin: true, admin: true, manager: true, stationLead: true },
  { label: "Damage Reports Status ändern", superAdmin: true, admin: true, manager: true, stationLead: false },
  { label: "Reparaturen verwalten", superAdmin: true, admin: true, manager: true, stationLead: true },
  { label: "Inventur durchführen", superAdmin: true, admin: true, manager: true, stationLead: true },
  { label: "Activity Log einsehen", superAdmin: true, admin: true, manager: true, stationLead: true },
  { label: "Feedback / Bug Reports senden", superAdmin: true, admin: true, manager: true, stationLead: true },
  { label: "Feedback verwalten", superAdmin: true, admin: true, manager: false, stationLead: false },
  { label: "Firmeneinstellungen ändern", superAdmin: true, admin: true, manager: false, stationLead: false },
  { label: "Barcode Scanner nutzen", superAdmin: true, admin: true, manager: true, stationLead: true },
  { label: "Fotos hochladen & löschen", superAdmin: true, admin: true, manager: true, stationLead: true },
];

function PermissionsTable() {
  return (
    <Card className="overflow-hidden" data-testid="card-permissions-overview">
      <CardContent className="p-0">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Rechte-Übersicht
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium min-w-[200px]">Berechtigung</th>
                <th className="text-center p-3 font-medium w-24">
                  <div className="flex flex-col items-center gap-1">
                    <ShieldAlert className="h-4 w-4 text-primary" />
                    <span className="text-xs">Super Admin</span>
                  </div>
                </th>
                <th className="text-center p-3 font-medium w-24">
                  <div className="flex flex-col items-center gap-1">
                    <ShieldCheck className="h-4 w-4" />
                    <span className="text-xs">Admin</span>
                  </div>
                </th>
                <th className="text-center p-3 font-medium w-24">
                  <div className="flex flex-col items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span className="text-xs">Manager</span>
                  </div>
                </th>
                <th className="text-center p-3 font-medium w-24">
                  <div className="flex flex-col items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span className="text-xs">Station Lead</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {PERMISSIONS.map((p, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-background" : "bg-muted/30"}>
                  <td className="p-3 font-medium">{p.label}</td>
                  <td className="text-center p-3">
                    {p.superAdmin ? <Check className="h-4 w-4 text-green-600 mx-auto" /> : <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />}
                  </td>
                  <td className="text-center p-3">
                    {p.admin ? <Check className="h-4 w-4 text-green-600 mx-auto" /> : <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />}
                  </td>
                  <td className="text-center p-3">
                    {p.manager ? <Check className="h-4 w-4 text-green-600 mx-auto" /> : <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />}
                  </td>
                  <td className="text-center p-3">
                    {p.stationLead ? <Check className="h-4 w-4 text-green-600 mx-auto" /> : <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export default function UsersPage() {
  const { toast } = useToast();
  const { user: currentUser, isSuperAdmin } = useAuth();
  const { data: usersList, isLoading } = useQuery<SafeUser[]>({ queryKey: ["/api/users"] });
  const { data: stationsList } = useQuery<Station[]>({ queryKey: ["/api/stations"] });

  const [open, setOpen] = useState(false);
  const [editUser, setEditUser] = useState<SafeUser | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("manager");
  const [stationId, setStationId] = useState("");
  const [superAdminFlag, setSuperAdminFlag] = useState(false);
  const [canEditEquipmentFlag, setCanEditEquipmentFlag] = useState(false);

  const openCreate = () => {
    setEditUser(null);
    setName("");
    setEmail("");
    setPassword("");
    setRole("manager");
    setStationId("");
    setSuperAdminFlag(false);
    setCanEditEquipmentFlag(false);
    setOpen(true);
  };

  const openEdit = (u: SafeUser) => {
    setEditUser(u);
    setName(u.name);
    setEmail(u.email);
    setPassword("");
    setRole(u.role);
    setStationId(u.assignedStationId?.toString() || "none");
    setSuperAdminFlag(u.isSuperAdmin || false);
    setCanEditEquipmentFlag(u.canEditEquipment || false);
    setOpen(true);
  };

  const createMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/users", {
        name,
        email,
        password,
        role,
        assignedStationId: stationId && stationId !== "none" ? parseInt(stationId) : null,
        isSuperAdmin: role === "admin" ? superAdminFlag : false,
        canEditEquipment: canEditEquipmentFlag,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "User created" });
      setOpen(false);
    },
    onError: (err: Error) => {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: () => {
      const data: any = {
        name,
        email,
        role,
        assignedStationId: stationId && stationId !== "none" ? parseInt(stationId) : null,
        isSuperAdmin: role === "admin" ? superAdminFlag : false,
        canEditEquipment: canEditEquipmentFlag,
      };
      if (password) data.password = password;
      return apiRequest("PATCH", `/api/users/${editUser!.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "User updated" });
      setOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "User deleted" });
    },
    onError: async (err: any) => {
      const msg = await err?.response?.json().catch(() => null);
      toast({ title: "Could not delete user", description: msg?.message || "An error occurred.", variant: "destructive" });
    },
  });

  const [deleteTarget, setDeleteTarget] = useState<SafeUser | null>(null);

  const handleDelete = (u: SafeUser) => {
    if (u.id === currentUser?.id) {
      toast({ title: "Cannot delete your own account", variant: "destructive" });
      return;
    }
    setDeleteTarget(u);
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      deleteMutation.mutate(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  const getStationName = (id: number | null) => {
    if (!id) return "None";
    return stationsList?.find((s) => s.id === id)?.name || `Station ${id}`;
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-1">
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-users-title">Users</h1>
        <Button onClick={openCreate} data-testid="button-add-user">
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editUser ? "Edit User" : "Add User"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" data-testid="input-user-name" />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@kitetracker.com" data-testid="input-user-email" />
            </div>
            <div className="space-y-2">
              <Label>{editUser ? "Password (leave blank to keep)" : "Password *"}</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="********" data-testid="input-user-password" />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={role} onValueChange={(v) => { setRole(v); if (v !== "admin") setSuperAdminFlag(false); }}>
                <SelectTrigger data-testid="select-user-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {isSuperAdmin && <SelectItem value="admin">Admin</SelectItem>}
                  <SelectItem value="manager">Hamburg Manager</SelectItem>
                  <SelectItem value="station_lead">Station Lead</SelectItem>
                </SelectContent>
              </Select>
              {!isSuperAdmin && editUser?.role === "admin" && (
                <p className="text-xs text-muted-foreground">Nur Super Admins können die Admin-Rolle ändern.</p>
              )}
            </div>
            {role === "admin" && (
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                <input
                  type="checkbox"
                  id="super-admin-flag"
                  checked={superAdminFlag}
                  onChange={(e) => setSuperAdminFlag(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                  data-testid="checkbox-super-admin"
                />
                <label htmlFor="super-admin-flag" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-primary" />
                  Super Admin
                  <span className="text-xs text-muted-foreground font-normal">(can manage users, delete equipment/invoices/stations)</span>
                </label>
              </div>
            )}
            {isSuperAdmin && (
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                <input
                  type="checkbox"
                  id="can-edit-equipment-flag"
                  checked={canEditEquipmentFlag}
                  onChange={(e) => setCanEditEquipmentFlag(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                  data-testid="checkbox-can-edit-equipment"
                />
                <label htmlFor="can-edit-equipment-flag" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                  <Pencil className="h-4 w-4 text-primary" />
                  Darf Material bearbeiten
                  <span className="text-xs text-muted-foreground font-normal">(can edit equipment master data)</span>
                </label>
              </div>
            )}
            {(role === "manager" || role === "station_lead") && (
              <div className="space-y-2">
                <Label>Assigned Location</Label>
                <Select value={stationId} onValueChange={setStationId}>
                  <SelectTrigger data-testid="select-user-station">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {stationsList?.filter((s) => !s.isVirtual).map((s) => (
                      <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button
              onClick={() => (editUser ? updateMutation.mutate() : createMutation.mutate())}
              disabled={!name || !email || (!editUser && !password) || createMutation.isPending || updateMutation.isPending}
              className="w-full"
              data-testid="button-save-user"
            >
              {editUser ? "Update User" : "Create User"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>User wirklich löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Bist du sicher, dass du <strong>{deleteTarget?.name}</strong> ({deleteTarget?.email}) löschen willst? Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" data-testid="button-confirm-delete">
              Ja, löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
      ) : !usersList?.length ? (
        <div className="text-center py-16">
          <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="font-medium">No users yet</h3>
        </div>
      ) : (
        <div className="space-y-3">
          {usersList.map((u) => (
            <Card key={u.id} data-testid={`card-user-${u.id}`}>
              <CardContent className="p-4 flex items-center justify-between gap-1">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${u.isSuperAdmin ? "bg-primary text-primary-foreground" : "bg-primary/10"}`}>
                    <span className={`text-sm font-semibold ${u.isSuperAdmin ? "" : "text-primary"}`}>
                      {u.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold" data-testid={`text-user-name-${u.id}`}>{u.name}</p>
                      <Badge variant={getRoleBadgeVariant(u)} className="text-[10px] no-default-hover-elevate no-default-active-elevate">
                        {u.isSuperAdmin && <ShieldAlert className="h-3 w-3 mr-1" />}
                        {getRoleLabel(u)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{u.email}</p>
                    {(u.role === "manager" || u.role === "station_lead") && (
                      <p className="text-xs text-muted-foreground">Location: {getStationName(u.assignedStationId)}</p>
                    )}
                    {u.canEditEquipment && u.role !== "admin" && u.role !== "manager" && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Pencil className="h-3 w-3" /> Darf Material bearbeiten
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  {(isSuperAdmin || u.role !== "admin") && (
                    <Button variant="ghost" size="icon" onClick={() => openEdit(u)} data-testid={`button-edit-user-${u.id}`}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                  {isSuperAdmin && (
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(u)} data-testid={`button-delete-user-${u.id}`} disabled={deleteMutation.isPending}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <PermissionsTable />
    </div>
  );
}
