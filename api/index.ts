import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";

const app = express();
const httpServer = createServer(app);

app.set("trust proxy", 1);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);
app.use(express.urlencoded({ extended: false }));

let ready: Promise<void> | null = null;
let initError: Error | null = null;

function ensureReady() {
  if (!ready) {
    ready = (async () => {
      const { registerRoutes } = await import("../server/routes");
      await registerRoutes(httpServer, app);

      app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
        const status = err.status || err.statusCode || 500;
        const message = err.message || "Internal Server Error";
        if (res.headersSent) return next(err);
        return res.status(status).json({ message });
      });
    })().catch((err) => {
      initError = err;
      console.error("[api/index] Initialization failed:", err);
      throw err;
    });
  }
  return ready;
}

export default async function handler(req: any, res: any) {
  try {
    await ensureReady();
  } catch (err: any) {
    console.error("[api/index] Handler error:", err);
    return res.status(500).json({
      error: "Server initialization failed",
      message: err?.message || String(err),
      stack: process.env.NODE_ENV !== "production" ? err?.stack : undefined,
    });
  }
  app(req, res);
}
