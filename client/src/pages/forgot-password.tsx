import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Wind, Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiRequest("POST", "/api/auth/forgot-password", { email });
      setSent(true);
    } catch (err: any) {
      toast({
        title: "Fehler",
        description: "Etwas ist schiefgelaufen. Bitte versuche es erneut.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Wind className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">KiteTracker</h1>
          <p className="text-muted-foreground">Passwort zurücksetzen</p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <h2 className="text-lg font-semibold text-center">
              {sent ? "E-Mail gesendet" : "Passwort vergessen?"}
            </h2>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <CheckCircle className="h-12 w-12 text-green-500" />
                </div>
                <p className="text-muted-foreground text-sm">
                  Falls ein Account mit dieser E-Mail-Adresse existiert, haben wir dir einen Reset-Link geschickt. Bitte prüfe auch deinen Spam-Ordner.
                </p>
                <p className="text-muted-foreground text-sm">
                  Der Link ist <strong>1 Stunde</strong> gültig.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Gib deine E-Mail-Adresse ein und wir schicken dir einen Link zum Zurücksetzen deines Passworts.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="email">E-Mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="du@kitetracker.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    data-testid="input-email-reset"
                    className="h-11"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-11"
                  disabled={loading}
                  data-testid="button-send-reset"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Reset-Link senden
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <div className="text-center">
          <Link href="/login" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Zurück zum Login
          </Link>
        </div>
      </div>
    </div>
  );
}
