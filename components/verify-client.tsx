"use client";

import { useState } from "react";

type Algorithm = "sha256" | "sha512";

export function VerifyClient() {
  const [receiptId, setReceiptId] = useState("");
  const [algorithm, setAlgorithm] = useState<Algorithm>("sha256");
  const [hashValue, setHashValue] = useState("");
  const [result, setResult] = useState<null | {
    found: boolean;
    receiptId?: string;
    message: string;
  }>(null);
  const [error, setError] = useState("");

  const verify = async () => {
    setError("");
    setResult(null);

    if (receiptId.trim()) {
      const response = await fetch(`/api/receipts/${encodeURIComponent(receiptId.trim())}`);
      if (!response.ok) {
        setResult({ found: false, message: "Receipt not found." });
        return;
      }
      const json = await response.json();
      setResult({
        found: true,
        receiptId: json.payload.receipt_id,
        message: "Receipt found by ID."
      });
      return;
    }

    if (!hashValue.trim()) {
      setError("Enter receipt ID or hash + algorithm.");
      return;
    }

    const response = await fetch(
      `/api/verify?hash_algorithm=${algorithm}&hash_value=${encodeURIComponent(hashValue.trim())}`
    );

    const json = await response.json().catch(() => null);

    if (!response.ok) {
      setError("Invalid verification input.");
      return;
    }

    if (!json?.exists) {
      setResult({ found: false, message: "No matching receipt found." });
      return;
    }

    setResult({
      found: true,
      receiptId: json.receipt.payload.receipt_id,
      message: "Matching receipt found."
    });
  };

  return (
    <div className="space-y-4 rounded border bg-white p-4">
      <h2 className="text-xl font-semibold">Verify</h2>
      <p className="text-sm text-slate-600">
        Paste a receipt ID, or provide hash + algorithm.
      </p>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Receipt ID</label>
        <input
          value={receiptId}
          onChange={(event) => setReceiptId(event.target.value)}
          className="w-full rounded border px-2 py-1"
          placeholder="receipt id"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Algorithm</label>
        <select
          value={algorithm}
          onChange={(event) => setAlgorithm(event.target.value as Algorithm)}
          className="rounded border px-2 py-1"
        >
          <option value="sha256">SHA-256</option>
          <option value="sha512">SHA-512</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Hash Value</label>
        <textarea
          value={hashValue}
          onChange={(event) => setHashValue(event.target.value)}
          className="min-h-24 w-full rounded border px-2 py-1"
          placeholder="hex hash"
        />
      </div>

      <button
        type="button"
        onClick={verify}
        className="rounded bg-blue-600 px-4 py-2 text-white"
      >
        Verify
      </button>

      {error && <p className="text-sm text-red-700">{error}</p>}

      {result && (
        <div className="rounded bg-slate-50 p-3 text-sm">
          <p>{result.message}</p>
          {result.found && result.receiptId && (
            <p>
              Receipt: <a href={`/r/${result.receiptId}`}>{result.receiptId}</a>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
