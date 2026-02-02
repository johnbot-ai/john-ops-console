const COOKIE_NAME = "ops_auth";

const textEncoder = new TextEncoder();

type SessionPayload = {
  v: 1;
  exp: number; // unix seconds
};

function base64FromBytes(bytes: Uint8Array): string {
  // Node.js
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }

  // Edge/runtime w/ btoa
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary);
}

function bytesFromBase64(base64: string): Uint8Array {
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(base64, "base64"));
  }

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function base64urlEncode(bytes: Uint8Array): string {
  return base64FromBytes(bytes)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64urlDecode(s: string): Uint8Array {
  const pad = s.length % 4;
  const padded = s
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(s.length + (pad === 0 ? 0 : 4 - pad), "=");
  return bytesFromBase64(padded);
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function getSigningSecret(): string | null {
  // Prefer a dedicated signing secret; fall back to the password.
  return process.env.AUTH_SECRET ?? process.env.OPS_PASSWORD ?? null;
}

async function hmacSha256Base64url(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const sig = await crypto.subtle.sign("HMAC", key, textEncoder.encode(message));
  return base64urlEncode(new Uint8Array(sig));
}

export function getCookieName(): string {
  return COOKIE_NAME;
}

export async function createSessionCookieValue(opts?: {
  ttlSeconds?: number;
}): Promise<string> {
  const secret = getSigningSecret();
  if (!secret) throw new Error("Missing AUTH_SECRET or OPS_PASSWORD env var");

  const ttlSeconds = opts?.ttlSeconds ?? 60 * 60 * 24 * 7; // 7 days
  const now = Math.floor(Date.now() / 1000);

  const payload: SessionPayload = {
    v: 1,
    exp: now + ttlSeconds,
  };

  const payloadB64 = base64urlEncode(textEncoder.encode(JSON.stringify(payload)));
  const sigB64 = await hmacSha256Base64url(payloadB64, secret);
  return `${payloadB64}.${sigB64}`;
}

export async function verifySessionCookieValue(cookieValue: string | undefined | null): Promise<boolean> {
  if (!cookieValue) return false;

  const secret = getSigningSecret();
  if (!secret) return false;

  const [payloadB64, sigB64] = cookieValue.split(".");
  if (!payloadB64 || !sigB64) return false;

  const expectedSig = await hmacSha256Base64url(payloadB64, secret);
  if (!constantTimeEqual(sigB64, expectedSig)) return false;

  try {
    const payloadJson = new TextDecoder().decode(base64urlDecode(payloadB64));
    const payload = JSON.parse(payloadJson) as Partial<SessionPayload>;

    if (payload.v !== 1) return false;
    if (typeof payload.exp !== "number") return false;

    const now = Math.floor(Date.now() / 1000);
    return payload.exp > now;
  } catch {
    return false;
  }
}
