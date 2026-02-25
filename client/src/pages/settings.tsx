import { useState, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileSpreadsheet, Loader2 } from "lucide-react";

export default function SettingsPage() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/equipment/import", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }
      const result = await res.json();
      setImportResult(result);
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      toast({ title: `Imported ${result.imported} items` });
    } catch (err: any) {
      toast({ title: "Import failed", description: err.message, variant: "destructive" });
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold tracking-tight" data-testid="text-settings-title">
        Settings
      </h1>

      <Card>
        <CardHeader className="pb-2">
          <h2 className="font-semibold">Account</h2>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Name</p>
              <p className="font-medium" data-testid="text-account-name">{user?.name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="font-medium" data-testid="text-account-email">{user?.email}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Role</p>
              <p className="font-medium capitalize">{user?.role}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {isAdmin && (
        <Card>
          <CardHeader className="pb-2">
            <h2 className="font-semibold flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Import Equipment from CSV
            </h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Upload a CSV file with columns: serial_number, type, brand, model, year, station_id, condition, notes, purchase_price, current_value
            </p>
            <div>
              <Label
                htmlFor="csv-import"
                className="flex items-center justify-center gap-2 p-6 border-2 border-dashed rounded-md cursor-pointer text-muted-foreground transition-colors"
              >
                {importing ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Upload className="h-5 w-5" />
                )}
                <span className="text-sm">{importing ? "Importing..." : "Select CSV file"}</span>
              </Label>
              <input
                ref={fileRef}
                id="csv-import"
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleImport}
                disabled={importing}
                data-testid="input-csv-import"
              />
            </div>

            {importResult && (
              <div className="p-4 rounded-md bg-muted/50 space-y-2">
                <p className="text-sm font-medium">Import Results</p>
                <div className="flex gap-4 text-sm">
                  <span className="text-green-600 dark:text-green-400">Imported: {importResult.imported}</span>
                  <span className="text-muted-foreground">Skipped: {importResult.skipped}</span>
                </div>
                {importResult.errors.length > 0 && (
                  <div className="text-xs text-destructive space-y-1 mt-2">
                    {importResult.errors.map((err, i) => (
                      <p key={i}>{err}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
