"use client";

import { useState } from "react";

type Payload = {
  receipt_id: string;
  hash_algorithm: "sha256" | "sha512";
  hash_value: string;
  created_at: string;
  visibility: string;
};

export function ReceiptActions(props: {
  payload: Payload;
  signature: string;
  kid: string;
}) {
  const [queueMessage, setQueueMessage] = useState("");

  const receiptJson = {
    payload: props.payload,
    signature: props.signature,
    kid: props.kid,
    alg: "Ed25519"
  };

  const copyReceipt = async () => {
    await navigator.clipboard.writeText(JSON.stringify(receiptJson, null, 2));
  };

  const downloadReceipt = () => {
    const blob = new Blob([JSON.stringify(receiptJson, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `receipt-${props.payload.receipt_id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const queueAnchoring = async () => {
    setQueueMessage("");
    const response = await fetch("/api/anchor/queue", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ receipt_id: props.payload.receipt_id })
    });

    const json = await response.json().catch(() => null);

    if (!response.ok) {
      setQueueMessage("Failed to queue anchoring.");
      return;
    }

    setQueueMessage(`Anchor status: ${json.anchor_status}`);
  };

  return (
    <div className="space-y-3 rounded border bg-white p-4">
      <h3 className="text-lg font-semibold">Actions</h3>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="rounded bg-slate-900 px-3 py-2 text-white"
          onClick={copyReceipt}
        >
          Copy
        </button>
        <button
          type="button"
          className="rounded border border-slate-300 px-3 py-2"
          onClick={downloadReceipt}
        >
          Download JSON
        </button>
        <button
          type="button"
          className="rounded bg-blue-600 px-3 py-2 text-white"
          onClick={queueAnchoring}
        >
          Queue for anchoring
        </button>
        <a href={`/report/${props.payload.receipt_id}`}>Report claim</a>
      </div>
      {queueMessage && <p className="text-sm text-slate-700">{queueMessage}</p>}
    </div>
  );
}
