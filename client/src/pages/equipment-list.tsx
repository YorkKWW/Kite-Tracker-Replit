import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ConditionBadge, StatusBadge } from "@/components/condition-badge";
import { Plus, Search, Package, SlidersHorizontal } from "lucide-react";
import type { Equipment, Station } from "@shared/schema";
import { EQUIPMENT_TYPE_LABELS } from "@shared/schema";

export default function EquipmentListPage() {
  const { isAdmin } = useAuth();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [stationFilter, setStationFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  const buildQuery = () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (typeFilter !== "all") params.set("type", typeFilter);
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (stationFilter !== "all") params.set("stationId", stationFilter);
    const q = params.toString();
    return q ? `?${q}` : "";
  };

  const { data: equipment, isLoading } = useQuery<Equipment[]>({
    queryKey: ["/api/equipment", buildQuery()],
    queryFn: async () => {
      const res = await fetch(`/api/equipment${buildQuery()}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const { data: stationsList } = useQuery<Station[]>({
    queryKey: ["/api/stations"],
  });

  const getStationName = (id: number | null) => {
    if (!id) return "Unassigned";
    return stationsList?.find((s) => s.id === id)?.name || `Station ${id}`;
  };

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-1 flex-wrap">
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-equipment-title">
          Equipment
        </h1>
        {isAdmin && (
          <Link href="/equipment/new">
            <Button data-testid="button-add-equipment">
              <Plus className="h-4 w-4 mr-2" />
              Add Equipment
            </Button>
          </Link>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search serial, brand, model..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              data-testid="input-search"
            />
          </div>
          <Button
            variant="secondary"
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            data-testid="button-toggle-filters"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger data-testid="select-type-filter">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(EQUIPMENT_TYPE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger data-testid="select-status-filter">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="in_repair">In Repair</SelectItem>
                <SelectItem value="retired">Retired</SelectItem>
                <SelectItem value="sold">Sold</SelectItem>
                <SelectItem value="in_transfer">In Transfer</SelectItem>
              </SelectContent>
            </Select>

            {isAdmin && (
              <Select value={stationFilter} onValueChange={setStationFilter}>
                <SelectTrigger data-testid="select-station-filter">
                  <SelectValue placeholder="All Stations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stations</SelectItem>
                  {stationsList?.map((s) => (
                    <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
      ) : !equipment?.length ? (
        <div className="text-center py-16">
          <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="font-medium text-lg">No equipment found</h3>
          <p className="text-muted-foreground text-sm mt-1">
            {search || typeFilter !== "all" || statusFilter !== "all"
              ? "Try adjusting your filters"
              : "Add your first piece of equipment"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {equipment.map((item) => (
            <Link key={item.id} href={`/equipment/${item.id}`}>
              <Card className="hover-elevate cursor-pointer transition-all" data-testid={`card-equipment-${item.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-1 mb-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-xs text-muted-foreground mb-1" data-testid={`text-serial-${item.id}`}>
                        {item.serialNumber}
                      </p>
                      <p className="font-semibold truncate">
                        {item.brand} {item.model}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {EQUIPMENT_TYPE_LABELS[item.type] || item.type}
                      </p>
                    </div>
                    <ConditionBadge rating={item.conditionRating} compact />
                  </div>
                  <div className="flex items-center justify-between gap-1 flex-wrap">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPinIcon className="h-3 w-3" />
                      {getStationName(item.currentStationId)}
                    </span>
                    <StatusBadge status={item.status} />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
