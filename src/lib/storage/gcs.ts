import { createHmac } from "node:crypto";

const DEFAULT_TTL_SECONDS = Number(process.env.SIGNED_URL_TTL_SECONDS ?? 900);

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export interface SignUrlOptions {
  method?: "GET" | "PUT" | "POST";
  ttlSeconds?: number;
  expiresAt?: Date;
}

export interface SignedUrl {
  url: string;
  expiresAt: Date;
}

function signingKey(): string {
  return requireEnv("GCS_SIGNED_URL_SIGNING_KEY");
}

function sign(canonical: string): string {
  return createHmac("sha256", signingKey())
    .update(canonical)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

export function signUrl(objectPath: string, options: SignUrlOptions = {}): SignedUrl {
  const bucket = requireEnv("GCS_BUCKET");
  const ttl = options.ttlSeconds ?? DEFAULT_TTL_SECONDS;
  const expiresAt = options.expiresAt ?? new Date(Date.now() + ttl * 1000);
  const date = Math.floor(expiresAt.getTime() / 1000);
  const signature = sign(`${options.method ?? "GET"}\n${bucket}/${objectPath}\n${date}`);
  const url = new URL(`https://storage.googleapis.com/${bucket}/${objectPath}`);
  url.searchParams.set("X-Goog-Algorithm", "GOOGLE-HMAC");
  url.searchParams.set("X-Goog-Credential", "surelm/anonymous");
  url.searchParams.set("X-Goog-Date", new Date(date * 1000).toISOString());
  url.searchParams.set("X-Goog-Expires", String(ttl));
  url.searchParams.set("X-Goog-SignedHeaders", "host");
  url.searchParams.set("X-Goog-Signature", signature);
  return { url: url.toString(), expiresAt };
}

export function verifySignedUrl(url: string): { valid: boolean; expiresAt: Date | null } {
  const parsed = new URL(url);
  const bucket = parsed.pathname.split("/")[1];
  if (!bucket) {
    return { valid: false, expiresAt: null };
  }
  const objectPath = parsed.pathname.slice(`/${bucket}/`.length);
  const date = Number(parsed.searchParams.get("X-Goog-Date") ?? "0");
  const expiresAt = new Date((date + Number(parsed.searchParams.get("X-Goog-Expires") ?? "0")) * 1000);
  const expectedSignature = sign(`GET\n${bucket}/${objectPath}\n${date}`);
  const valid =
    parsed.searchParams.get("X-Goog-Signature") === expectedSignature &&
    expiresAt.getTime() > Date.now();
  return { valid, expiresAt };
}
