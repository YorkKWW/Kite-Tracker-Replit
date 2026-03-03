import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScanLine } from "lucide-react";

interface BarcodeScannerProps {
  open: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
}

// EAN-13 barcode pattern (13 digits, often starting with 684811... for Core)
// These are product UPC codes, NOT serial numbers — ignore them
function isProductUpc(code: string): boolean {
  return /^\d{12,14}$/.test(code);
}

// Serial number pattern for Core kites: uppercase alphanumeric, mix of letters+digits
function isSerialNumber(code: string): boolean {
  return /^[A-Z0-9]{8,20}$/.test(code) && /[A-Z]/.test(code) && /[0-9]/.test(code);
}

export function BarcodeScanner({ open, onClose, onScan }: BarcodeScannerProps) {
  const scannerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState("");
  const [scanning, setScanning] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      stopScanner();
      return;
    }
    setHint(null);
    startScanner();
    return () => stopScanner();
  }, [open]);

  const startScanner = async () => {
    try {
      setError(null);
      setScanning(true);

      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import("html5-qrcode");

      const scannerId = "barcode-scanner-container";
      if (!document.getElementById(scannerId)) return;

      // Explicitly enable CODE_128 (serial numbers) + EAN_13 (UPC, to detect & filter out)
      const scanner = new Html5Qrcode(scannerId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.DATA_MATRIX,
        ],
        verbose: false,
      });
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 15,
          // Wider scan box optimized for linear barcodes (landscape format)
          qrbox: { width: 280, height: 100 },
        },
        (decodedText: string) => {
          // If we scanned an EAN-13/UPC product code (all digits), ignore and hint user
          if (isProductUpc(decodedText)) {
            setHint("UPC code detected — please scan the LOWER barcode (serial number)");
            return; // Keep scanning
          }
          // Accepted — serial number or QR code
          stopScanner();
          onScan(decodedText);
          onClose();
        },
        undefined,
      );
    } catch (err: any) {
      setScanning(false);
      if (err?.message?.toLowerCase().includes("permission")) {
        setError("Camera access denied. Please allow camera access or enter the serial number manually.");
      } else {
        setError("Could not start camera. Enter the serial number manually below.");
      }
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch {
      }
      scannerRef.current = null;
    }
    setScanning(false);
  };

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
      <DialogContent className="max-w-sm p-0 overflow-hidden" aria-describedby="scanner-description">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle className="flex items-center gap-2 text-base">
            <ScanLine className="h-4 w-4 shrink-0" />
            Scan Serial Number
          </DialogTitle>
          <p id="scanner-description" className="text-xs text-muted-foreground leading-snug mt-0.5">
            Point camera at the <strong>lower barcode</strong> on the equipment label (marked S/N).
            The upper barcode is the product UPC — it will be ignored automatically.
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
              <div id="barcode-scanner-container" ref={containerRef} className="w-full" />

              {/* Scan guide overlay */}
              {scanning && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-2">
                  {/* Horizontal scan window for linear barcode */}
                  <div className="relative">
                    <div className="border-2 border-primary/80 rounded w-64 h-16 bg-transparent" />
                    {/* Corner accents */}
                    <div className="absolute -top-0.5 -left-0.5 w-4 h-4 border-t-2 border-l-2 border-primary rounded-tl" />
                    <div className="absolute -top-0.5 -right-0.5 w-4 h-4 border-t-2 border-r-2 border-primary rounded-tr" />
                    <div className="absolute -bottom-0.5 -left-0.5 w-4 h-4 border-b-2 border-l-2 border-primary rounded-bl" />
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 border-b-2 border-r-2 border-primary rounded-br" />
                    {/* Scan line animation */}
                    <div className="absolute inset-x-1 top-1/2 -translate-y-1/2 h-px bg-primary/60 animate-pulse" />
                  </div>
                  <span className="text-[10px] text-white/70 bg-black/40 px-2 py-0.5 rounded">
                    Aim at S/N barcode
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Hint when UPC was scanned instead of serial */}
          {hint && (
            <div className="rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-3 py-2">
              <p className="text-xs text-amber-700 dark:text-amber-300">{hint}</p>
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
