"use client";

import { useState } from "react";
import nacl from "tweetnacl";

type Payload = {
  receipt_id: string;
  hash_algorithm: "sha256" | "sha512";
  hash_value: string;
  created_at: string;
  visibility: string;
};

function decodeBase64(input: string): Uint8Array {
  const bytes = atob(input);
  const out = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i += 1) {
    out[i] = bytes.charCodeAt(i);
  }
  return out;
}

function canonicalReceiptJson(payload: Payload): string {
  return JSON.stringify({
    receipt_id: payload.receipt_id,
    hash_algorithm: payload.hash_algorithm,
    hash_value: payload.hash_value,
    created_at: payload.created_at,
    visibility: payload.visibility
  });
}

export function SignatureVerify(props: { payload: Payload; signature: string }) {
  const [status, setStatus] = useState<string>("");

  const runVerify = async () => {
    setStatus("Verifying...");

    try {
      const keyResponse = await fetch("/api/public-key");
      if (!keyResponse.ok) {
        setStatus("Failed to load public key.");
        return;
      }

      const keyData = await keyResponse.json();
      const publicKey = decodeBase64(keyData.public_key_raw_b64);
      const signature = decodeBase64(props.signature);
      const messageBytes = new TextEncoder().encode(
        canonicalReceiptJson(props.payload)
      );

      const ok = nacl.sign.detached.verify(messageBytes, signature, publicKey);
      setStatus(ok ? "Signature is valid." : "Signature is invalid.");
    } catch {
      setStatus("Verification failed.");
    }
  };

  return (
    <div className="space-y-3 rounded border bg-white p-4">
      <h3 className="text-lg font-semibold">Signature</h3>
      <button
        type="button"
        className="rounded bg-emerald-600 px-3 py-2 text-white"
        onClick={runVerify}
      >
        Verify signature
      </button>
      {status && <p className="text-sm text-slate-700">{status}</p>}
    </div>
  );
}
