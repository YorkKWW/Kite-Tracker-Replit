import { useEffect, useRef, useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScanLine, Loader2 } from "lucide-react";

interface BarcodeScannerProps {
  open: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
}

function isProductUpc(code: string): boolean {
  return /^\d{8,14}$/.test(code.trim());
}

export function BarcodeScanner({ open, onClose, onScan }: BarcodeScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null);
  const quaggaRef = useRef<any>(null);
  const hasDetectedRef = useRef(false);

  const [error, setError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState("");
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastDetected, setLastDetected] = useState<string | null>(null);

  const stopScanner = useCallback(() => {
    if (quaggaRef.current) {
      try { quaggaRef.current.stop(); } catch {}
      quaggaRef.current = null;
    }
    hasDetectedRef.current = false;
    setScanning(false);
    setLoading(false);
    setLastDetected(null);
  }, []);

  const startScanner = useCallback(async () => {
    if (!scannerRef.current) return;
    setError(null);
    setLoading(true);
    hasDetectedRef.current = false;
    setLastDetected(null);

    try {
      const Quagga = (await import("@ericblade/quagga2")).default;
      quaggaRef.current = Quagga;

      await new Promise<void>((resolve, reject) => {
        Quagga.init(
          {
            inputStream: {
              type: "LiveStream",
              target: scannerRef.current!,
              constraints: {
                facingMode: "environment",
                width: { min: 640, ideal: 1280 },
                height: { min: 480, ideal: 720 },
              },
              area: {
                top: "30%",
                right: "5%",
                left: "5%",
                bottom: "20%",
              },
            },
            locator: {
              patchSize: "medium",
              halfSample: true,
            },
            decoder: {
              readers: [
                "code_128_reader",
                "code_39_reader",
              ],
              multiple: false,
            },
            locate: true,
            frequency: 10,
          },
          (err: any) => {
            if (err) {
              reject(err);
              return;
            }
            resolve();
          },
        );
      });

      Quagga.start();
      setLoading(false);
      setScanning(true);

      const detectionCounts = new Map<string, number>();

      Quagga.onDetected((result: any) => {
        if (hasDetectedRef.current) return;

        const code = result?.codeResult?.code?.trim();
        if (!code || code.length < 4) return;

        if (isProductUpc(code)) {
          setLastDetected("EAN detected — please scan the LOWER barcode (S/N)");
          return;
        }

        const count = (detectionCounts.get(code) || 0) + 1;
        detectionCounts.set(code, count);

        if (count >= 2) {
          hasDetectedRef.current = true;
          try { Quagga.stop(); } catch {}
          onScan(code);
          onClose();
        } else {
          setLastDetected(`Detected: ${code} — confirming...`);
        }
      });
    } catch (err: any) {
      setLoading(false);
      setScanning(false);
      const msg = (err?.message || err?.name || String(err)).toLowerCase();
      if (msg.includes("notallowed") || msg.includes("permission") || msg.includes("denied")) {
        setError("Camera access denied. Please allow camera access in iPhone Settings → Safari → Camera.");
      } else if (msg.includes("notfound") || msg.includes("overconstrained") || msg.includes("notreadable")) {
        setError("No camera found.");
      } else {
        setError(`Camera error: ${err?.message || String(err)}`);
      }
    }
  }, [onScan, onClose, stopScanner]);

  useEffect(() => {
    if (!open) {
      stopScanner();
      return;
    }

    const timeout = setTimeout(() => {
      startScanner();
    }, 100);

    return () => {
      clearTimeout(timeout);
      stopScanner();
    };
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
      <DialogContent
        className="max-w-sm p-0 overflow-hidden"
        aria-describedby="scanner-desc"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle className="flex items-center gap-2 text-base">
            <ScanLine className="h-4 w-4 shrink-0" />
            Scan Serial Number
          </DialogTitle>
          <p id="scanner-desc" className="text-xs text-muted-foreground leading-snug mt-0.5">
            Scan the <strong>lower barcode</strong> on the label (S/N).
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
              style={{ minHeight: 240 }}
            >
              {loading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-black">
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                </div>
              )}
              <div
                ref={scannerRef}
                className="w-full"
                style={{ minHeight: 240 }}
                data-testid="scanner-viewport"
              />
              {scanning && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-2">
                  <div className="relative">
                    <div className="border-2 border-primary/80 rounded w-64 h-14" />
                    <div className="absolute -top-0.5 -left-0.5 w-4 h-4 border-t-2 border-l-2 border-primary rounded-tl" />
                    <div className="absolute -top-0.5 -right-0.5 w-4 h-4 border-t-2 border-r-2 border-primary rounded-tr" />
                    <div className="absolute -bottom-0.5 -left-0.5 w-4 h-4 border-b-2 border-l-2 border-primary rounded-bl" />
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 border-b-2 border-r-2 border-primary rounded-br" />
                    <div className="absolute inset-x-1 top-1/2 -translate-y-1/2 h-px bg-primary/60 animate-pulse" />
                  </div>
                  <span className="text-[10px] text-white/70 bg-black/50 px-2 py-0.5 rounded">
                    Center S/N barcode
                  </span>
                </div>
              )}
            </div>
          )}

          {lastDetected && (
            <div className="rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-3 py-2">
              <p className="text-xs text-amber-700 dark:text-amber-300">{lastDetected}</p>
            </div>
          )}

          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[11px] text-muted-foreground">or enter manually</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Serial number (e.g. KXR708BBA2032579)"
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
