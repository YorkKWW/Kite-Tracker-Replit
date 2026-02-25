import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Plus, Users, Pencil, Trash2 } from "lucide-react";
import type { Station } from "@shared/schema";

interface SafeUser {
  id: number;
  name: string;
  email: string;
  role: string;
  assignedStationId: number | null;
}

export default function UsersPage() {
  const { toast } = useToast();
  const { data: usersList, isLoading } = useQuery<SafeUser[]>({ queryKey: ["/api/users"] });
  const { data: stationsList } = useQuery<Station[]>({ queryKey: ["/api/stations"] });

  const [open, setOpen] = useState(false);
  const [editUser, setEditUser] = useState<SafeUser | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("manager");
  const [stationId, setStationId] = useState("");

  const openCreate = () => {
    setEditUser(null);
    setName("");
    setEmail("");
    setPassword("");
    setRole("manager");
    setStationId("");
    setOpen(true);
  };

  const openEdit = (u: SafeUser) => {
    setEditUser(u);
    setName(u.name);
    setEmail(u.email);
    setPassword("");
    setRole(u.role);
    setStationId(u.assignedStationId?.toString() || "none");
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
  });

  const getStationName = (id: number | null) => {
    if (!id) return "None";
    return stationsList?.find((s) => s.id === id)?.name || `Station ${id}`;
  };

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-4xl mx-auto">
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
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger data-testid="select-user-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Station Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {role === "manager" && (
              <div className="space-y-2">
                <Label>Assigned Station</Label>
                <Select value={stationId} onValueChange={setStationId}>
                  <SelectTrigger data-testid="select-user-station">
                    <SelectValue placeholder="Select station" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {stationsList?.map((s) => (
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
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">
                      {u.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold" data-testid={`text-user-name-${u.id}`}>{u.name}</p>
                      <Badge variant="secondary" className="text-[10px] no-default-hover-elevate no-default-active-elevate">
                        {u.role === "admin" ? "Admin" : "Manager"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{u.email}</p>
                    {u.role === "manager" && (
                      <p className="text-xs text-muted-foreground">Station: {getStationName(u.assignedStationId)}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(u)} data-testid={`button-edit-user-${u.id}`}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(u.id)} data-testid={`button-delete-user-${u.id}`}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
