import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
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

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);

  const { seedDatabase } = await import("./seed");
  await seedDatabase();

  const { db: dbInstance } = await import("./db");
  const { sql } = await import("drizzle-orm");
  try {
    const kitePattern = ' ([0-9]+[.][0-9]+)( |$)';
    const boardPattern = '([0-9]{2,3})x[0-9]{2,3}';

    const typeFixRes = await dbInstance.execute(sql`
      UPDATE equipment SET type = 'board'
      WHERE type = 'kite'
        AND (model ~* 'freeride|choice|deluxe|fusion' OR model ~ '[0-9]{3}x[0-9]{2}')
        AND model !~* 'nexus|xr[0-9]|gts[0-9]|rebel|evo|delta'
    `);

    const kiteRes = await dbInstance.execute(sql`
      UPDATE equipment 
      SET type_specific_fields = jsonb_set(
        type_specific_fields::jsonb, '{size}', 
        to_jsonb((regexp_match(model, ${kitePattern}))[1])
      )
      WHERE type IN ('kite', 'wing') 
        AND model ~ ${kitePattern}
        AND type_specific_fields::jsonb->>'size' != (regexp_match(model, ${kitePattern}))[1]
    `);
    const boardRes = await dbInstance.execute(sql`
      UPDATE equipment 
      SET type_specific_fields = jsonb_set(
        type_specific_fields::jsonb, '{size}', 
        to_jsonb((regexp_match(model, ${boardPattern}))[1])
      )
      WHERE type IN ('board', 'foilboard') 
        AND model ~ ${boardPattern}
        AND type_specific_fields::jsonb->>'size' != (regexp_match(model, ${boardPattern}))[1]
    `);
    console.log(`Equipment size migration: ${typeFixRes.rowCount} type fixes, ${kiteRes.rowCount} kites, ${boardRes.rowCount} boards`);

    const stationFixes = [
      { oldName: "Fuerteventura", newName: "Dakhla", location: "Dakhla", country: "Morocco" },
      { oldName: "Zanzibar", newName: "Tatajuba", location: "Tatajuba", country: "Brazil" },
      { oldName: "Office Hamburg Shop", newName: "Office Hamburg Warehouse", location: "Hamburg", country: "Germany" },
      { oldName: "Office Hamburg Warehouse/Incoming", newName: "Incoming – Not Yet Assigned", location: "Hamburg", country: "Germany" },
    ];
    for (const fix of stationFixes) {
      const res = await dbInstance.execute(sql`
        UPDATE stations SET name = ${fix.newName}, location = ${fix.location}, country = ${fix.country}
        WHERE name = ${fix.oldName}
      `);
      if (res.rowCount && res.rowCount > 0) {
        console.log(`Station renamed: "${fix.oldName}" → "${fix.newName}"`);
      }
    }
    const deleteRes = await dbInstance.execute(sql`
      DELETE FROM stations WHERE name = 'Tarifa'
        AND NOT EXISTS (SELECT 1 FROM equipment WHERE current_station_id = stations.id)
    `);
    if (deleteRes.rowCount && deleteRes.rowCount > 0) {
      console.log(`Removed empty station: "Tarifa"`);
    }
  } catch (e) {
    console.error("Equipment size migration error:", e);
  }

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
