# Claude Code Briefing — KiteTracker Migration

## Kontext

KiteTracker ist eine Node.js/TypeScript Full-Stack-App (Express Backend, React + Vite Frontend). Das Projekt wird von Replit zu Vercel + Supabase migriert.

## Was bereits erledigt ist

- ✅ GitHub Repo vorhanden, `dev` Branch erstellt
- ✅ Supabase Dev + Prod Projekte angelegt
- ✅ Schema und Daten in Supabase Dev eingespielt
- ✅ Supabase Prod — Schema eingespielt, Daten folgen noch
- ✅ Vercel Projekt vorhanden, mit GitHub verbunden
- ✅ Alle Environment Variables in Vercel eingetragen

## Was Claude Code jetzt tun muss

### 1. Datenbankverbindung

- Drizzle DB-Verbindung auf `DATABASE_URL` aus `process.env` umstellen
- Alle Replit-spezifischen DB-Verbindungen entfernen

### 2. Object Storage ersetzen

Der kritischste Teil. Der gesamte Code steckt in:

```
server/replit_integrations/object_storage/
```

**Aktuell:** Google Cloud Storage via Replit Sidecar (`http://127.0.0.1:1106`) — funktioniert nur in Replit.

**Ersetzen durch:** Supabase Storage SDK (`@supabase/supabase-js`)

Der Flow bleibt gleich:

1. Frontend fragt `/api/uploads/request-url` → bekommt Signed URL
2. Frontend uploaded direkt per `PUT`
3. `/objects/...` leitet auf Signed Download URL weiter

Nur die Implementierung dahinter ändert sich auf Supabase Storage.

Supabase Storage Buckets müssen noch angelegt werden:

- `documents`
- `invoices`
- `equipment`
- `pricelists`

### 3. Replit-Integrationen bereinigen

- Ordner `server/replit_integrations/` komplett durchsuchen
- Alle Referenzen auf `127.0.0.1:1106` entfernen
- `@google-cloud/storage` dependency entfernen
- Alle anderen Replit-spezifischen Packages/Configs entfernen

### 4. Environment Variables

Sicherstellen dass alle diese Variables aus `process.env` gelesen werden:

```
DATABASE_URL
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
SESSION_SECRET
GITHUB_PAT
SMTP_PASS
SMTP_HOST
SMTP_PORT
SMTP_USER
EMAIL_FROM
RESEND_API_KEY
BOS_API_KEY
```

### 5. Vercel Konfiguration

KiteTracker hat ein Express Backend + Vite Frontend. Vercel ist Serverless — das braucht eine `vercel.json`:

```json
{
  "builds": [
    { "src": "server/index.ts", "use": "@vercel/node" },
    { "src": "client/package.json", "use": "@vercel/static-build" }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "server/index.ts" },
    { "src": "/(.*)", "dest": "client/$1" }
  ]
}
```

→ Ggf. anpassen je nach tatsächlicher Projektstruktur.

### 6. Build testen

```bash
# Lokal mit den neuen Supabase Dev Variablen testen
npm run build
npm run dev
```

## Wichtige Hinweise

- Immer auf dem `dev` Branch arbeiten, nie direkt auf `main`
- Nach erfolgreichem Test auf Dev → Pull Request `dev` → `main`
- Supabase Prod Daten müssen noch eingespielt werden (nach erfolgreichem Dev-Test)
- Die `DEFAULT_OBJECT_STORAGE_BUCKET_ID`, `PUBLIC_OBJECT_SEARCH_PATHS` und `PRIVATE_OBJECT_DIR` Secrets aus Replit werden durch Supabase Storage ersetzt und fallen weg

## Offene Fragen für Claude Code

1. Wie ist die genaue Projektstruktur? (`ls -la`, `cat package.json`)
2. Gibt es weitere Replit-spezifische Dateien? (`.replit`, `replit.nix`)
3. Gibt es Cron Jobs oder Background Workers die ersetzt werden müssen?
