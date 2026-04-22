import { Storage } from "@google-cloud/storage";
import * as fs from "fs";
import * as path from "path";

const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";

const storageClient = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
    type: "external_account",
    credential_source: {
      url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
      format: {
        type: "json",
        subject_token_field_name: "access_token",
      },
    },
    universe_domain: "googleapis.com",
  },
  projectId: "",
});

function parseObjectPath(rawPath: string): { bucketName: string; prefix: string } {
  let p = rawPath.trim();
  if (!p.startsWith("/")) p = `/${p}`;
  const segments = p.slice(1).split("/");
  const bucketName = segments[0];
  if (!bucketName) {
    throw new Error(
      `Invalid path "${rawPath}": must be of the form /<bucket-name>[/<prefix>]`
    );
  }
  const prefix = segments.slice(1).join("/");
  return { bucketName, prefix };
}

function collectPaths(): Array<{ bucketName: string; prefix: string; label: string }> {
  const collected: Array<{ bucketName: string; prefix: string; label: string }> = [];

  const privateDir = process.env.PRIVATE_OBJECT_DIR || "";
  if (privateDir) {
    const parsed = parseObjectPath(privateDir);
    collected.push({ ...parsed, label: "PRIVATE_OBJECT_DIR" });
  } else {
    console.warn("Warning: PRIVATE_OBJECT_DIR is not set — skipping private objects.");
  }

  const publicPaths = process.env.PUBLIC_OBJECT_SEARCH_PATHS || "";
  if (publicPaths) {
    const paths = publicPaths
      .split(",")
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
    for (const p of paths) {
      const parsed = parseObjectPath(p);
      collected.push({ ...parsed, label: `PUBLIC_OBJECT_SEARCH_PATHS (${p})` });
    }
  } else {
    console.warn("Warning: PUBLIC_OBJECT_SEARCH_PATHS is not set — skipping public objects.");
  }

  return collected;
}

async function downloadAll() {
  const paths = collectPaths();

  if (paths.length === 0) {
    console.error(
      "No paths to download. Set PRIVATE_OBJECT_DIR and/or PUBLIC_OBJECT_SEARCH_PATHS."
    );
    process.exit(1);
  }

  const downloadsDir = path.resolve("downloads");
  fs.mkdirSync(downloadsDir, { recursive: true });

  let totalFiles = 0;
  let skippedFiles = 0;
  let totalBytes = 0;

  for (const { bucketName, prefix, label } of paths) {
    console.log(`\nListing files from bucket="${bucketName}" prefix="${prefix}" [${label}]`);

    const bucket = storageClient.bucket(bucketName);
    const [files] = await bucket.getFiles({ prefix: prefix || undefined });

    if (files.length === 0) {
      console.log("  No files found.");
      continue;
    }

    for (const file of files) {
      const objectName = file.name;

      // Skip GCS directory placeholder objects (trailing slash, 0 bytes)
      if (objectName.endsWith("/")) {
        console.log(`  [SKIP]     ${objectName} (directory placeholder)`);
        skippedFiles++;
        continue;
      }

      const localFilePath = path.join(downloadsDir, bucketName, objectName);

      if (fs.existsSync(localFilePath)) {
        console.log(`  [SKIP]     ${objectName}`);
        skippedFiles++;
        continue;
      }

      fs.mkdirSync(path.dirname(localFilePath), { recursive: true });

      const [metadata] = await file.getMetadata();
      const fileSize = Number(metadata.size ?? 0);

      process.stdout.write(`  [DOWNLOAD] ${objectName} (${formatBytes(fileSize)}) ... `);

      await file.download({ destination: localFilePath });

      console.log("done");
      totalFiles++;
      totalBytes += fileSize;
    }
  }

  console.log("\n--- Summary ---");
  console.log(`Downloaded: ${totalFiles} file(s) (${formatBytes(totalBytes)})`);
  console.log(`Skipped:    ${skippedFiles} file(s) (already existed locally)`);
  console.log(`Output dir: ${downloadsDir}`);
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

downloadAll().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
