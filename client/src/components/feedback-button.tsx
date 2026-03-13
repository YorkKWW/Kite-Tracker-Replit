import { useState, useRef, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { MessageSquarePlus, Mic, Square, Send, Camera, Loader2, X } from "lucide-react";

const PAGE_LABELS: Record<string, string> = {
  "/": "Dashboard",
  "/equipment": "Equipment List",
  "/transfers": "Transfers",
  "/sales": "Sales",
  "/incidents": "Incidents",
  "/repairs": "Repairs",
  "/price-lists": "Price Lists",
  "/invoice-import": "Invoice Import",
  "/stations": "Stations",
  "/users": "Users",
  "/activity": "Activity",
  "/settings": "Settings",
  "/feedback": "Feedback",
};

function getPageLabel(path: string): string {
  if (PAGE_LABELS[path]) return PAGE_LABELS[path];
  if (path.startsWith("/equipment/")) return "Equipment Detail";
  if (path.startsWith("/inventory-check")) return "Inventory Check";
  if (path.startsWith("/stations/")) return "Station Detail";
  return path;
}

const supportsMediaRecorder = typeof window !== "undefined" && typeof window.MediaRecorder !== "undefined";

function getPreferredMimeType(): string {
  if (!supportsMediaRecorder) return "";
  if (MediaRecorder.isTypeSupported("audio/mp4")) return "audio/mp4";
  if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) return "audio/webm;codecs=opus";
  if (MediaRecorder.isTypeSupported("audio/webm")) return "audio/webm";
  return "";
}

async function getUploadUrl(): Promise<{ uploadURL: string; objectPath: string }> {
  const res = await fetch("/api/feedback/upload-url", { credentials: "include" });
  if (!res.ok) throw new Error("Could not get upload URL");
  return res.json();
}

async function uploadBlob(blob: Blob, uploadURL: string): Promise<void> {
  const res = await fetch(uploadURL, {
    method: "PUT",
    body: blob,
    headers: { "Content-Type": blob.type },
  });
  if (!res.ok) throw new Error("Upload failed");
}

interface AttachmentItem {
  blob: Blob;
  preview: string;
}

export function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dialogOpenRef = useRef(false);
  const [location] = useLocation();
  const { toast } = useToast();

  dialogOpenRef.current = open;

  const revokeUrls = useCallback(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    attachments.forEach(a => URL.revokeObjectURL(a.preview));
  }, [audioUrl, attachments]);

  const reset = useCallback(() => {
    revokeUrls();
    setMessage("");
    setAudioBlob(null);
    setAudioUrl(null);
    setAttachments([]);
    setRecording(false);
    setRecordingDuration(0);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    mediaRecorderRef.current = null;
  }, [revokeUrls]);

  useEffect(() => {
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async () => {
    if (!supportsMediaRecorder) {
      toast({ title: "Not supported", description: "Your browser does not support audio recording. Please use text input.", variant: "destructive" });
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = getPreferredMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/mp4" });
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        if (dialogOpenRef.current) {
          setAudioBlob(blob);
          setAudioUrl(URL.createObjectURL(blob));
        }
      };

      recorder.start();
      setRecording(true);
      setRecordingDuration(0);
      timerRef.current = setInterval(() => {
        setRecordingDuration((d) => d + 1);
      }, 1000);
    } catch {
      toast({ title: "Microphone not available", description: "Please allow microphone access.", variant: "destructive" });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
  };

  const removeAudio = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
  };

  const handleScreenshot = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const newAttachments: AttachmentItem[] = [];
    for (let i = 0; i < files.length; i++) {
      newAttachments.push({
        blob: files[i],
        preview: URL.createObjectURL(files[i]),
      });
    }
    setAttachments(prev => [...prev, ...newAttachments]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const submitMutation = useMutation({
    mutationFn: async () => {
      setUploading(true);
      try {
        let audioPath: string | null = null;
        const attachmentPaths: string[] = [];

        if (audioBlob) {
          const { uploadURL, objectPath } = await getUploadUrl();
          await uploadBlob(audioBlob, uploadURL);
          audioPath = objectPath;
        }

        for (const att of attachments) {
          const { uploadURL, objectPath } = await getUploadUrl();
          await uploadBlob(att.blob, uploadURL);
          attachmentPaths.push(objectPath);
        }

        return apiRequest("POST", "/api/feedback", {
          pageUrl: location,
          message: message.trim() || null,
          audioUrl: audioPath,
          attachmentUrls: attachmentPaths,
        });
      } finally {
        setUploading(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/feedback"] });
      toast({ title: "Thanks for your feedback!", description: "We'll look into it." });
      reset();
      setOpen(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Feedback could not be sent.", variant: "destructive" });
    },
  });

  const canSubmit = (message.trim().length > 0 || audioBlob !== null || attachments.length > 0) && !uploading;

  const formatDuration = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 md:bottom-6 z-50 h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
        data-testid="button-feedback"
        aria-label="Give feedback"
      >
        <MessageSquarePlus className="h-5 w-5" />
      </button>

      <Dialog
        open={open}
        onOpenChange={(o) => {
          if (!o) {
            if (recording) stopRecording();
            reset();
          }
          setOpen(o);
        }}
      >
        <DialogContent className="max-w-sm" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="text-base">Report bug / Suggest improvement</DialogTitle>
          </DialogHeader>

          <div className="text-xs text-muted-foreground bg-muted rounded-md px-3 py-2">
            Page: <span className="font-medium">{getPageLabel(location)}</span>
            <span className="ml-1 font-mono text-[10px] opacity-60">({location})</span>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {!recording && !audioBlob && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={startRecording}
                    className="gap-2 flex-1"
                    disabled={!supportsMediaRecorder}
                    data-testid="button-start-recording"
                  >
                    <Mic className="h-4 w-4 text-red-500" />
                    {supportsMediaRecorder ? "Voice message" : "Recording not available"}
                  </Button>
                )}

                {recording && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={stopRecording}
                    className="gap-2 flex-1 animate-pulse"
                    data-testid="button-stop-recording"
                  >
                    <Square className="h-3 w-3" />
                    Stop recording ({formatDuration(recordingDuration)})
                  </Button>
                )}

                {audioBlob && !recording && (
                  <div className="flex-1 flex items-center gap-2">
                    <audio src={audioUrl!} controls className="h-8 flex-1" data-testid="audio-preview" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={removeAudio}
                      data-testid="button-remove-audio"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="relative">
              <Textarea
                placeholder="Briefly describe what's not working..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                className="text-sm"
                data-testid="input-feedback-message"
              />
              <span className="absolute bottom-1 right-2 text-[10px] text-muted-foreground">
                {message.length > 0 ? `${message.length} chars` : "optional if voice message"}
              </span>
            </div>

            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="gap-2 w-full"
                data-testid="button-add-screenshot"
              >
                <Camera className="h-4 w-4" />
                Attach screenshot / photo{attachments.length > 0 ? ` (${attachments.length})` : ""}
              </Button>

              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {attachments.map((att, index) => (
                    <div key={index} className="relative inline-block">
                      <img
                        src={att.preview}
                        alt={`Attachment ${index + 1}`}
                        className="h-20 rounded-md border object-cover"
                        data-testid={`img-screenshot-preview-${index}`}
                      />
                      <button
                        onClick={() => removeAttachment(index)}
                        className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-white flex items-center justify-center text-xs"
                        data-testid={`button-remove-screenshot-${index}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                className="hidden"
                onChange={handleScreenshot}
              />
            </div>

            <Button
              className="w-full gap-2"
              disabled={!canSubmit}
              onClick={() => submitMutation.mutate()}
              data-testid="button-submit-feedback"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Submit feedback
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
