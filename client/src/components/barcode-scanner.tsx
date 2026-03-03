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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const activeRef = useRef(false);

  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState("");
  const [scanning, setScanning] = useState(false);

  const stopScanner = useCallback(() => {
    activeRef.current = false;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setScanning(false);
  }, []);

  const startScanner = useCallback(async () => {
    setError(null);
    setHint(null);

    try {
      // 1. Get camera stream directly — most reliable on Safari iOS
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;

      const video = videoRef.current;
      if (!video) { stream.getTracks().forEach((t) => t.stop()); return; }

      video.srcObject = stream;
      video.setAttribute("playsinline", "true");
      video.setAttribute("muted", "true");
      await video.play();

      setScanning(true);
      activeRef.current = true;

      // 2. Load ZXing decoder
      const {
        MultiFormatReader,
        RGBLuminanceSource,
        BinaryBitmap,
        HybridBinarizer,
        DecodeHintType,
        BarcodeFormat,
        NotFoundException,
      } = await import("@zxing/library");

      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.CODE_128,
        BarcodeFormat.CODE_39,
        BarcodeFormat.QR_CODE,
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.DATA_MATRIX,
      ]);
      hints.set(DecodeHintType.TRY_HARDER, true);

      const reader = new MultiFormatReader();
      reader.setHints(hints);

      const canvas = canvasRef.current || document.createElement("canvas");

      // 3. Process frames via requestAnimationFrame
      const processFrame = () => {
        if (!activeRef.current) return;

        const v = videoRef.current;
        if (!v || v.readyState < v.HAVE_CURRENT_DATA || v.videoWidth === 0) {
          rafRef.current = requestAnimationFrame(processFrame);
          return;
        }

        canvas.width = v.videoWidth;
        canvas.height = v.videoHeight;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) { rafRef.current = requestAnimationFrame(processFrame); return; }

        ctx.drawImage(v, 0, 0, canvas.width, canvas.height);

        try {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const luminance = new RGBLuminanceSource(
            new Uint8ClampedArray(imageData.data),
            canvas.width,
            canvas.height,
          );
          const bitmap = new BinaryBitmap(new HybridBinarizer(luminance));
          const result = reader.decode(bitmap);
          const text = result.getText();

          if (isProductUpc(text)) {
            setHint("UPC-Produktcode erkannt — bitte den UNTEREN Barcode (S/N) scannen");
            rafRef.current = requestAnimationFrame(processFrame);
            return;
          }

          // Got a serial number
          activeRef.current = false;
          stopScanner();
          onScan(text);
          onClose();
          return;
        } catch (e: any) {
          // NotFoundException is normal — no barcode in this frame
          if (!(e instanceof NotFoundException)) {
            console.warn("ZXing decode error:", e?.message);
          }
        }

        rafRef.current = requestAnimationFrame(processFrame);
      };

      rafRef.current = requestAnimationFrame(processFrame);
    } catch (err: any) {
      setScanning(false);
      const msg = (err?.message || err?.name || "").toLowerCase();
      if (msg.includes("notallowed") || msg.includes("permission") || msg.includes("denied")) {
        setError("Kamerazugriff verweigert. Bitte Kameraerlaubnis in den iPhone-Einstellungen erteilen.");
      } else if (msg.includes("notfound") || msg.includes("overconstrained")) {
        setError("Keine Rückkamera gefunden.");
      } else {
        setError(`Kamera-Fehler: ${err?.message || "Unbekannter Fehler"}. Seriennummer manuell eingeben.`);
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
              style={{ minHeight: 220 }}
            >
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                style={{ minHeight: 220 }}
                playsInline
                muted
                autoPlay
              />
              <canvas ref={canvasRef} className="hidden" />

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
