import { useEffect, useRef, useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScanLine } from "lucide-react";

interface BarcodeScannerProps {
  open: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
}

function isProductUpc(code: string): boolean {
  return /^\d{8,14}$/.test(code.trim());
}

export function BarcodeScanner({ open, onClose, onScan }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState("");
  const [scanning, setScanning] = useState(false);

  const stopScanner = useCallback(() => {
    if (controlsRef.current) {
      try { controlsRef.current.stop(); } catch {}
      controlsRef.current = null;
    }
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    setScanning(false);
  }, []);

  const startScanner = useCallback(async () => {
    setError(null);
    setHint(null);

    try {
      const { BrowserMultiFormatReader, NotFoundException } = await import("@zxing/browser");
      const { BarcodeFormat, DecodeHintType } = await import("@zxing/library");

      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.CODE_128,
        BarcodeFormat.CODE_39,
        BarcodeFormat.QR_CODE,
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.DATA_MATRIX,
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E,
      ]);
      hints.set(DecodeHintType.TRY_HARDER, true);

      const reader = new BrowserMultiFormatReader(hints);

      if (!videoRef.current) return;

      setScanning(true);

      const controls = await reader.decodeFromConstraints(
        {
          video: {
            facingMode: "environment",
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        },
        videoRef.current,
        (result, err) => {
          if (result) {
            const text = result.getText();
            if (isProductUpc(text)) {
              setHint("UPC-Produktcode erkannt — bitte den UNTEREN Barcode (S/N) scannen");
              return;
            }
            setHint(null);
            stopScanner();
            onScan(text);
            onClose();
          }
          if (err && !(err instanceof NotFoundException)) {
            console.warn("Scan error:", err);
          }
        },
      );

      controlsRef.current = controls;
    } catch (err: any) {
      setScanning(false);
      const msg = err?.message?.toLowerCase() || "";
      if (msg.includes("permission") || msg.includes("notallowed")) {
        setError("Kamerazugriff verweigert. Bitte Kameraerlaubnis erteilen oder Seriennummer manuell eingeben.");
      } else if (msg.includes("notfound") || msg.includes("no camera")) {
        setError("Keine Kamera gefunden. Seriennummer manuell eingeben.");
      } else {
        setError("Kamera konnte nicht gestartet werden. Seriennummer manuell eingeben.");
      }
    }
  }, [onScan, onClose, stopScanner]);

  useEffect(() => {
    if (!open) {
      stopScanner();
      return;
    }
    startScanner();
    return () => stopScanner();
  }, [open]);

  const handleManualSubmit = () => {
    const code = manualCode.trim().toUpperCase();
    if (code) {
      stopScanner();
      onScan(code);
      onClose();
      setManualCode("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { stopScanner(); onClose(); } }}>
      <DialogContent className="max-w-sm p-0 overflow-hidden" aria-describedby="scanner-desc">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle className="flex items-center gap-2 text-base">
            <ScanLine className="h-4 w-4 shrink-0" />
            Scan Serial Number
          </DialogTitle>
          <p id="scanner-desc" className="text-xs text-muted-foreground leading-snug mt-0.5">
            Den <strong>unteren Barcode</strong> auf dem Etikett scannen (S/N).
            Der obere EAN-Barcode wird automatisch ignoriert.
          </p>
        </DialogHeader>

        <div className="px-4 pb-4 space-y-3">
          {error ? (
            <div className="rounded-md bg-muted p-4 text-center">
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          ) : (
            <div
              className="relative w-full bg-black rounded-lg overflow-hidden"
              style={{ minHeight: 230 }}
            >
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                style={{ minHeight: 230 }}
                autoPlay
                playsInline
                muted
              />

              {scanning && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-2">
                  <div className="relative">
                    <div className="border-2 border-primary/80 rounded w-64 h-16" />
                    <div className="absolute -top-0.5 -left-0.5 w-4 h-4 border-t-2 border-l-2 border-primary rounded-tl" />
                    <div className="absolute -top-0.5 -right-0.5 w-4 h-4 border-t-2 border-r-2 border-primary rounded-tr" />
                    <div className="absolute -bottom-0.5 -left-0.5 w-4 h-4 border-b-2 border-l-2 border-primary rounded-bl" />
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 border-b-2 border-r-2 border-primary rounded-br" />
                    <div className="absolute inset-x-1 top-1/2 -translate-y-1/2 h-px bg-primary/60 animate-pulse" />
                  </div>
                  <span className="text-[10px] text-white/70 bg-black/50 px-2 py-0.5 rounded">
                    Unteren S/N Barcode zentrieren
                  </span>
                </div>
              )}
            </div>
          )}

          {hint && (
            <div className="rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-3 py-2">
              <p className="text-xs text-amber-700 dark:text-amber-300">{hint}</p>
            </div>
          )}

          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[11px] text-muted-foreground">oder manuell eingeben</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Seriennummer (z.B. KXR708BBA2032579)"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()}
              className="font-mono text-sm"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              data-testid="input-manual-code"
            />
            <Button onClick={handleManualSubmit} disabled={!manualCode.trim()} data-testid="button-submit-code">
              Go
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
