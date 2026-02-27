import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Plus, MapPin, Pencil, Trash2, Inbox } from "lucide-react";
import type { Station } from "@shared/schema";

export default function StationsPage() {
  const { toast } = useToast();
  const { data: stationsList, isLoading } = useQuery<Station[]>({ queryKey: ["/api/stations"] });
  const [open, setOpen] = useState(false);
  const [editStation, setEditStation] = useState<Station | null>(null);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [country, setCountry] = useState("");

  const openCreate = () => {
    setEditStation(null);
    setName("");
    setLocation("");
    setCountry("");
    setOpen(true);
  };

  const openEdit = (s: Station) => {
    setEditStation(s);
    setName(s.name);
    setLocation(s.location || "");
    setCountry(s.country || "");
    setOpen(true);
  };

  const createMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/stations", { name, location: location || null, country: country || null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stations"] });
      toast({ title: "Location created" });
      setOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", `/api/stations/${editStation!.id}`, { name, location: location || null, country: country || null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stations"] });
      toast({ title: "Location updated" });
      setOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/stations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stations"] });
      toast({ title: "Location deleted" });
    },
  });

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-1">
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-stations-title">Locations</h1>
        <Button onClick={openCreate} data-testid="button-add-station">
          <Plus className="h-4 w-4 mr-2" />
          Add Location
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editStation ? "Edit Location" : "Add Location"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Fuerteventura" data-testid="input-station-name" />
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Corralejo" data-testid="input-station-location" />
            </div>
            <div className="space-y-2">
              <Label>Country</Label>
              <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Spain" data-testid="input-station-country" />
            </div>
            <Button
              onClick={() => (editStation ? updateMutation.mutate() : createMutation.mutate())}
              disabled={!name || createMutation.isPending || updateMutation.isPending}
              className="w-full"
              data-testid="button-save-station"
            >
              {editStation ? "Update Location" : "Create Location"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
      ) : !stationsList?.length ? (
        <div className="text-center py-16">
          <MapPin className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="font-medium">No locations yet</h3>
          <p className="text-sm text-muted-foreground mt-1">Add your first kitesurf location</p>
        </div>
      ) : (
        <div className="space-y-3">
          {stationsList.map((s) => (
            <Card key={s.id} data-testid={`card-station-${s.id}`} className={s.isVirtual ? "border-amber-300 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-900/10" : ""}>
              <CardContent className="p-4 flex items-center justify-between gap-1">
                <Link href={`/stations/${s.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`p-2 rounded-md shrink-0 ${s.isVirtual ? "bg-amber-100 dark:bg-amber-900/30" : "bg-primary/10"}`}>
                    {s.isVirtual ? <Inbox className="h-5 w-5 text-amber-600 dark:text-amber-400" /> : <MapPin className="h-5 w-5 text-primary" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold" data-testid={`text-station-${s.id}`}>{s.name}</p>
                      {s.isVirtual && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-200 text-amber-800 dark:bg-amber-800 dark:text-amber-200 uppercase tracking-wide">Staging</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {s.isVirtual ? "Virtual staging location – equipment awaiting assignment" : ([s.location, s.country].filter(Boolean).join(", ") || "No location")}
                    </p>
                  </div>
                </Link>
                <div className="flex gap-1">
                  {!s.isVirtual && (
                    <Button variant="ghost" size="icon" onClick={() => openEdit(s)} data-testid={`button-edit-station-${s.id}`}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                  {!s.isVirtual && (
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(s.id)} data-testid={`button-delete-station-${s.id}`}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
