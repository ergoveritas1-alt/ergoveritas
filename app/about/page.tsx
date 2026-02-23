import { getPublicKeyInfo } from "@/lib/crypto";

export default function AboutPage() {
  const keyInfo = (() => {
    try {
      return getPublicKeyInfo();
    } catch {
      return null;
    }
  })();

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold">About ErgoVeritas</h1>
      <p className="max-w-3xl text-slate-700">
        ErgoVeritas is a privacy-first proof-of-existence registry. It records a
        timestamped, signed receipt for submitted hashes. Files are hashed in
        the browser and are not uploaded in this MVP.
      </p>
      <p className="text-sm text-slate-600">
        This service provides technical evidence of existence timing, not legal
        ownership adjudication.
      </p>

      <section className="space-y-2 rounded border bg-white p-4">
        <h2 className="text-xl font-semibold">Public Key</h2>
        {keyInfo ? (
          <>
            <p className="text-sm">KID: {keyInfo.kid}</p>
            <p className="text-sm">Algorithm: {keyInfo.alg}</p>
            <p className="break-all text-sm">DER (base64): {keyInfo.public_key_der_b64}</p>
            <p className="break-all text-sm">Raw (base64): {keyInfo.public_key_raw_b64}</p>
          </>
        ) : (
          <p className="text-sm text-slate-700">
            Public key not configured yet. Set Ed25519 key env vars in
            <code> .env.local</code>.
          </p>
        )}
      </section>
    </div>
  );
}
