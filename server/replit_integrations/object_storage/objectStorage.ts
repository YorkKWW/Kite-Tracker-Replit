import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { Response } from "express";
import { randomUUID } from "crypto";

const BUCKET = "private";

function getSupabase(): SupabaseClient {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export class SupabaseStorageFile {
  constructor(
    public readonly bucket: string,
    public readonly path: string,
  ) {}

  async delete(_opts?: { ignoreNotFound?: boolean }): Promise<void> {
    try {
      await getSupabase().storage.from(this.bucket).remove([this.path]);
    } catch {
      // Silently ignore deletion errors
    }
  }
}

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

export class ObjectStorageService {
  async getObjectEntityUploadURL(): Promise<string> {
    const objectId = randomUUID();
    const { data, error } = await getSupabase().storage
      .from(BUCKET)
      .createSignedUploadUrl(objectId);
    if (error || !data) throw new Error(`Failed to create upload URL: ${error?.message}`);
    return data.signedUrl;
  }

  normalizeObjectEntityPath(rawPath: string): string {
    if (!rawPath.includes("/storage/v1/")) return rawPath;
    try {
      const url = new URL(rawPath);
      const segments = url.pathname.split("/");
      const bucketIdx = segments.indexOf(BUCKET);
      if (bucketIdx === -1) return rawPath;
      return `/objects/${segments.slice(bucketIdx + 1).join("/")}`;
    } catch {
      return rawPath;
    }
  }

  private resolveStoragePath(objectPath: string): string {
    if (!objectPath.startsWith("/objects/")) throw new ObjectNotFoundError();
    return objectPath.slice("/objects/".length);
  }

  async getObjectEntitySignedURL(objectPath: string): Promise<string> {
    const storagePath = this.resolveStoragePath(objectPath);
    const { data, error } = await getSupabase().storage
      .from(BUCKET)
      .createSignedUrl(storagePath, 3600);
    if (error || !data) throw new ObjectNotFoundError();
    return data.signedUrl;
  }

  async getObjectEntityFile(objectPath: string): Promise<SupabaseStorageFile> {
    const storagePath = this.resolveStoragePath(objectPath);
    const { error } = await getSupabase().storage
      .from(BUCKET)
      .createSignedUrl(storagePath, 60);
    if (error) throw new ObjectNotFoundError();
    return new SupabaseStorageFile(BUCKET, storagePath);
  }

  async downloadObject(file: SupabaseStorageFile, res: Response, _cacheTtlSec = 3600): Promise<void> {
    const { data, error } = await getSupabase().storage
      .from(file.bucket)
      .createSignedUrl(file.path, 3600);
    if (error || !data) {
      if (!res.headersSent) res.status(500).json({ error: "Error downloading file" });
      return;
    }
    res.redirect(data.signedUrl);
  }

  async uploadBuffer(storagePath: string, buffer: Buffer, contentType: string): Promise<string> {
    const { error } = await getSupabase().storage
      .from(BUCKET)
      .upload(storagePath, buffer, { contentType, upsert: true });
    if (error) throw new Error(`Upload failed: ${error.message}`);
    return `/objects/${storagePath}`;
  }
}
