import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import {
  MessageSquarePlus,
  Mic,
  Image,
  FileText,
  Clock,
  User,
  MapPin,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Timer,
} from "lucide-react";
import type { Feedback } from "@shared/schema";

type FeedbackWithUser = Feedback & { userName: string; userRole: string };

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof AlertCircle }> = {
  open: { label: "Offen", variant: "destructive", icon: AlertCircle },
  in_progress: { label: "In Bearbeitung", variant: "default", icon: Timer },
  resolved: { label: "Erledigt", variant: "secondary", icon: CheckCircle2 },
};

const PAGE_LABELS: Record<string, string> = {
  "/": "Dashboard",
  "/equipment": "Equipment",
  "/transfers": "Transfers",
  "/sales": "Sales",
  "/incidents": "Incidents",
  "/repairs": "Repairs",
  "/price-lists": "Preislisten",
  "/invoice-import": "Rechnungsimport",
  "/stations": "Standorte",
  "/users": "Benutzer",
  "/activity": "Aktivitäten",
  "/settings": "Einstellungen",
};

function getPageLabel(path: string): string {
  if (PAGE_LABELS[path]) return PAGE_LABELS[path];
  if (path.startsWith("/equipment/")) return "Equipment Detail";
  if (path.startsWith("/inventory-check")) return "Inventur";
  if (path.startsWith("/stations/")) return "Standort Detail";
  return path;
}

function FeedbackCard({ item }: { item: FeedbackWithUser }) {
  const [editing, setEditing] = useState(false);
  const [notes, setNotes] = useState(item.adminNotes ?? "");
  const [status, setStatus] = useState(item.status);
  const { toast } = useToast();

  const updateMutation = useMutation({
    mutationFn: () =>
      apiRequest("PATCH", `/api/feedback/${item.id}`, { status, adminNotes: notes || null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/feedback"] });
      toast({ title: "Aktualisiert" });
      setEditing(false);
    },
  });

  const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.open;
  const StatusIcon = cfg.icon;
  const date = new Date(item.createdAt);

  return (
    <Card data-testid={`card-feedback-${item.id}`}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{item.userName}</span>
            <Badge variant="outline" className="text-[10px]">{item.userRole}</Badge>
          </div>
          <Badge variant={cfg.variant} className="gap-1 text-xs">
            <StatusIcon className="h-3 w-3" />
            {cfg.label}
          </Badge>
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {date.toLocaleDateString("de-DE")} {date.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {getPageLabel(item.pageUrl)}
            <span className="font-mono text-[10px] opacity-60">({item.pageUrl})</span>
          </span>
        </div>

        {item.audioUrl && (
          <div className="flex items-center gap-2">
            <Mic className="h-4 w-4 text-red-500 shrink-0" />
            <audio
              src={`/objects/${item.audioUrl}`}
              controls
              className="h-8 flex-1"
              data-testid={`audio-feedback-${item.id}`}
            />
          </div>
        )}

        {item.message && (
          <div className="flex gap-2">
            <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-sm whitespace-pre-wrap" data-testid={`text-feedback-message-${item.id}`}>{item.message}</p>
          </div>
        )}

        {item.screenshotUrl && (
          <div className="flex gap-2">
            <Image className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <a href={`/objects/${item.screenshotUrl}`} target="_blank" rel="noopener noreferrer">
              <img
                src={`/objects/${item.screenshotUrl}`}
                alt="Screenshot"
                className="max-h-40 rounded-md border object-contain cursor-pointer hover:opacity-80"
                data-testid={`img-feedback-screenshot-${item.id}`}
              />
            </a>
          </div>
        )}

        {item.adminNotes && !editing && (
          <div className="bg-muted rounded-md p-2 text-xs">
            <span className="font-medium">Admin-Notiz:</span> {item.adminNotes}
          </div>
        )}

        {!editing ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setNotes(item.adminNotes ?? "");
              setStatus(item.status);
              setEditing(true);
            }}
            data-testid={`button-edit-feedback-${item.id}`}
          >
            Bearbeiten
          </Button>
        ) : (
          <div className="space-y-2 border-t pt-2">
            <div className="flex gap-2">
              <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                <SelectTrigger className="w-40" data-testid={`select-feedback-status-${item.id}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Offen</SelectItem>
                  <SelectItem value="in_progress">In Bearbeitung</SelectItem>
                  <SelectItem value="resolved">Erledigt</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Textarea
              placeholder="Admin-Notiz..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="text-sm"
              data-testid={`input-admin-notes-${item.id}`}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => updateMutation.mutate()}
                disabled={updateMutation.isPending}
                data-testid={`button-save-feedback-${item.id}`}
              >
                {updateMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Speichern"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                Abbrechen
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function FeedbackAdminPage() {
  const { isAdmin } = useAuth();
  const [filter, setFilter] = useState<string>("all");

  const { data: items, isLoading } = useQuery<FeedbackWithUser[]>({
    queryKey: ["/api/feedback"],
    staleTime: 0,
    enabled: isAdmin,
  });

  if (!isAdmin) {
    return (
      <div className="p-6 text-center text-muted-foreground">Nur für Admins.</div>
    );
  }

  const filtered = items?.filter((i) => filter === "all" || i.status === filter) ?? [];
  const openCount = items?.filter((i) => i.status === "open").length ?? 0;

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquarePlus className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-bold" data-testid="text-feedback-title">Feedback & Bug Reports</h1>
          {openCount > 0 && (
            <Badge variant="destructive" className="text-xs">{openCount} offen</Badge>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        {[
          { val: "all", label: "Alle" },
          { val: "open", label: "Offen" },
          { val: "in_progress", label: "In Bearbeitung" },
          { val: "resolved", label: "Erledigt" },
        ].map((f) => (
          <Button
            key={f.val}
            variant={filter === f.val ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setFilter(f.val)}
            data-testid={`button-filter-${f.val}`}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground text-sm">
          Keine Einträge gefunden.
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((item) => (
          <FeedbackCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
