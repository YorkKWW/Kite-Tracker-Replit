import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { registerRoutes } from "../server/routes";

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

const ready = registerRoutes(httpServer, app)
  .then(() => {
    app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      if (res.headersSent) return next(err);
      return res.status(status).json({ message });
    });
  })
  .catch((err) => {
    console.error("[api/index] Initialization failed:", err);
    throw err;
  });

export default async function handler(req: any, res: any) {
  try {
    await ready;
  } catch (err: any) {
    return res.status(500).json({
      error: "Server initialization failed",
      message: err?.message || String(err),
    });
  }
  app(req, res);
}
