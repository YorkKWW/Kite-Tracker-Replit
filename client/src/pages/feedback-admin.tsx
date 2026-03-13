import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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
  Send,
  MessageCircle,
} from "lucide-react";
import type { Feedback, FeedbackAttachment, FeedbackComment } from "@shared/schema";

type FeedbackWithUser = Feedback & { userName: string; userRole: string; attachments: FeedbackAttachment[] };

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof AlertCircle }> = {
  open: { label: "Open", variant: "destructive", icon: AlertCircle },
  in_progress: { label: "In Progress", variant: "default", icon: Timer },
  resolved: { label: "Resolved", variant: "secondary", icon: CheckCircle2 },
};

const PAGE_LABELS: Record<string, string> = {
  "/": "Dashboard",
  "/equipment": "Equipment",
  "/transfers": "Transfers",
  "/sales": "Sales",
  "/incidents": "Incidents",
  "/repairs": "Repairs",
  "/price-lists": "Price Lists",
  "/invoice-import": "Invoice Import",
  "/stations": "Locations",
  "/users": "Users",
  "/activity": "Activity",
  "/settings": "Settings",
};

function getPageLabel(path: string): string {
  if (PAGE_LABELS[path]) return PAGE_LABELS[path];
  if (path.startsWith("/equipment/")) return "Equipment Detail";
  if (path.startsWith("/inventory-check")) return "Inventory Check";
  if (path.startsWith("/stations/")) return "Location Detail";
  return path;
}

type CommentWithUser = FeedbackComment & { userName: string };

function CommentThread({ feedbackId }: { feedbackId: number }) {
  const [newComment, setNewComment] = useState("");
  const { user } = useAuth();

  const { data: comments } = useQuery<CommentWithUser[]>({
    queryKey: ["/api/feedback", feedbackId, "comments"],
    queryFn: async () => {
      const res = await fetch(`/api/feedback/${feedbackId}/comments`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    staleTime: 0,
  });

  const addMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/feedback/${feedbackId}/comments`, { message: newComment.trim() }),
    onSuccess: () => {
      setNewComment("");
      queryClient.invalidateQueries({ queryKey: ["/api/feedback", feedbackId, "comments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  return (
    <div className="border-t pt-3 space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <MessageCircle className="h-3.5 w-3.5" />
        Comments {comments && comments.length > 0 && `(${comments.length})`}
      </div>
      {comments?.map((c) => (
        <div key={c.id} className="bg-muted/50 rounded-md p-2 text-xs" data-testid={`comment-${c.id}`}>
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="font-semibold">{c.userName}</span>
            <span className="text-muted-foreground">
              {new Date(c.createdAt).toLocaleDateString("de-DE")} {new Date(c.createdAt).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
          <p className="whitespace-pre-wrap">{c.message}</p>
        </div>
      ))}
      <div className="flex gap-2">
        <Input
          placeholder="Write a message…"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="text-sm h-8"
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && newComment.trim()) { e.preventDefault(); addMutation.mutate(); } }}
          data-testid={`input-comment-${feedbackId}`}
        />
        <Button
          size="sm"
          className="h-8 px-2"
          disabled={!newComment.trim() || addMutation.isPending}
          onClick={() => addMutation.mutate()}
          data-testid={`button-send-comment-${feedbackId}`}
        >
          {addMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
        </Button>
      </div>
    </div>
  );
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
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
      toast({ title: "Updated" });
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
            {item.ticketNumber && (
              <span className="font-mono text-xs font-bold text-primary" data-testid={`text-ticket-${item.id}`}>{item.ticketNumber}</span>
            )}
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
              src={item.audioUrl}
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

        {(item.attachments?.length > 0 || item.screenshotUrl) && (
          <div className="flex gap-2">
            <Image className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <div className="flex flex-wrap gap-2">
              {item.attachments?.map((att, idx) => (
                <a key={att.id} href={att.url} target="_blank" rel="noopener noreferrer">
                  <img
                    src={att.url}
                    alt={`Attachment ${idx + 1}`}
                    className="max-h-40 rounded-md border object-contain cursor-pointer hover:opacity-80"
                    data-testid={`img-feedback-attachment-${item.id}-${idx}`}
                  />
                </a>
              ))}
              {item.screenshotUrl && !item.attachments?.some(att => att.url === item.screenshotUrl) && (
                <a href={item.screenshotUrl} target="_blank" rel="noopener noreferrer">
                  <img
                    src={item.screenshotUrl}
                    alt="Screenshot"
                    className="max-h-40 rounded-md border object-contain cursor-pointer hover:opacity-80"
                    data-testid={`img-feedback-screenshot-${item.id}`}
                  />
                </a>
              )}
            </div>
          </div>
        )}

        {item.adminNotes && !editing && (
          <div className="bg-muted rounded-md p-2 text-xs">
            <span className="font-medium">Admin note:</span> {item.adminNotes}
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
            Edit
          </Button>
        ) : (
          <div className="space-y-2 border-t pt-2">
            <div className="flex gap-2">
              <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                <SelectTrigger className="w-40" data-testid={`select-feedback-status-${item.id}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Textarea
              placeholder="Admin note..."
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
                {updateMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        <CommentThread feedbackId={item.id} />
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
  });

  const filtered = items?.filter((i) => filter === "all" || i.status === filter) ?? [];
  const openCount = items?.filter((i) => i.status === "open").length ?? 0;

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquarePlus className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-bold" data-testid="text-feedback-title">Feedback & Bug Reports</h1>
          {openCount > 0 && (
            <Badge variant="destructive" className="text-xs">{openCount} open</Badge>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        {[
          { val: "all", label: "All" },
          { val: "open", label: "Open" },
          { val: "in_progress", label: "In Progress" },
          { val: "resolved", label: "Resolved" },
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
          No entries found.
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
