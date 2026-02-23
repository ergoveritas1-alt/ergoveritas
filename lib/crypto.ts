import {
  createHash,
  createPrivateKey,
  createPublicKey,
  sign as signDetached,
  KeyObject
} from "node:crypto";
import {
  getEd25519PrivateDerB64,
  getEd25519PublicDerB64
} from "@/lib/env";
import type { ReceiptPayload } from "@/lib/types";
import { canonicalReceiptJson } from "@/lib/canonical";

let cachedPrivateKey: KeyObject | null = null;
let cachedPublicKey: KeyObject | null = null;

function base64UrlToBase64(input: string): string {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4;
  if (padding === 2) {
    return `${normalized}==`;
  }
  if (padding === 3) {
    return `${normalized}=`;
  }
  return normalized;
}

function getPublicKey(): KeyObject {
  if (cachedPublicKey) {
    return cachedPublicKey;
  }
  cachedPublicKey = createPublicKey({
    key: Buffer.from(getEd25519PublicDerB64(), "base64"),
    format: "der",
    type: "spki"
  });
  return cachedPublicKey;
}

function getPrivateKey(): KeyObject {
  if (cachedPrivateKey) {
    return cachedPrivateKey;
  }
  cachedPrivateKey = createPrivateKey({
    key: Buffer.from(getEd25519PrivateDerB64(), "base64"),
    format: "der",
    type: "pkcs8"
  });
  return cachedPrivateKey;
}

export function sha256Hex(input: string | Buffer): string {
  return createHash("sha256").update(input).digest("hex");
}

export function getKid(): string {
  const digest = sha256Hex(Buffer.from(getEd25519PublicDerB64(), "base64"));
  return `ev_${digest.slice(0, 8)}`;
}

export function signReceiptPayload(payload: ReceiptPayload): string {
  const message = Buffer.from(canonicalReceiptJson(payload), "utf8");
  const signature = signDetached(null, message, getPrivateKey());
  return signature.toString("base64");
}

export function getPublicKeyInfo() {
  const publicKey = getPublicKey();
  const jwk = publicKey.export({ format: "jwk" }) as JsonWebKey;

  if (!jwk.x) {
    throw new Error("Unable to derive raw Ed25519 public key");
  }

  return {
    kid: getKid(),
    alg: "Ed25519" as const,
    public_key_der_b64: getEd25519PublicDerB64(),
    public_key_raw_b64: base64UrlToBase64(jwk.x)
  };
}
