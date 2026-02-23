"use client";

import { useMemo, useState } from "react";

type ReceiptRow = {
  id: string;
  hash_algorithm: string;
  hash_value: string;
  visibility: string;
  created_at: string;
  anchor_status: string;
  anchor_batch_id: string | null;
};

type DisputeRow = {
  id: string;
  receipt_id: string;
  reason: string;
  details: string | null;
  contact_email: string;
  evidence_urls: string | null;
  wants_idv: boolean;
  status: "new" | "reviewing" | "sent_to_arbitrator" | "closed";
  created_at: string;
};

type BatchRow = {
  id: string;
  merkle_root: string;
  status: string;
  receipt_ids_json: string;
  created_at: string;
};

export function AdminClient() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [receipts, setReceipts] = useState<ReceiptRow[]>([]);
  const [disputes, setDisputes] = useState<DisputeRow[]>([]);
  const [batches, setBatches] = useState<BatchRow[]>([]);
  const [message, setMessage] = useState("");

  const headers = useMemo(
    () => ({ "x-admin-password": password, "content-type": "application/json" }),
    [password]
  );

  const loadAll = async () => {
    setMessage("");

    const [receiptRes, disputeRes, batchRes] = await Promise.all([
      fetch("/api/admin/receipts", { headers }),
      fetch("/api/admin/disputes", { headers }),
      fetch("/api/admin/batches", { headers })
    ]);

    if (!receiptRes.ok || !disputeRes.ok || !batchRes.ok) {
      setAuthed(false);
      setMessage("Authentication failed.");
      return;
    }

    const receiptJson = await receiptRes.json();
    const disputeJson = await disputeRes.json();
    const batchJson = await batchRes.json();

    setReceipts(receiptJson.receipts ?? []);
    setDisputes(disputeJson.disputes ?? []);
    setBatches(batchJson.batches ?? []);
    setAuthed(true);
  };

  const buildBatch = async () => {
    setMessage("");
    const response = await fetch("/api/anchor/build", {
      method: "POST",
      headers
    });

    const json = await response.json().catch(() => null);
    if (!response.ok) {
      setMessage(json?.error ?? "Batch build failed.");
      return;
    }

    setMessage(`Batch built: ${json.batch_id}`);
    await loadAll();
  };

  const updateDisputeStatus = async (
    disputeId: string,
    status: DisputeRow["status"]
  ) => {
    const response = await fetch(`/api/admin/disputes/${disputeId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ status })
    });

    if (!response.ok) {
      setMessage("Failed to update dispute status.");
      return;
    }

    await loadAll();
  };

  return (
    <div className="space-y-6">
      <section className="rounded border bg-white p-4">
        <h2 className="text-xl font-semibold">Admin Lite</h2>
        <div className="mt-3 flex gap-3">
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Admin password"
            className="w-full max-w-sm rounded border px-2 py-1"
          />
          <button
            type="button"
            className="rounded bg-slate-900 px-4 py-2 text-white"
            onClick={loadAll}
          >
            Load dashboard
          </button>
        </div>
        {message && <p className="mt-3 text-sm text-slate-700">{message}</p>}
      </section>

      {authed && (
        <>
          <section className="rounded border bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Batches</h3>
              <button
                type="button"
                className="rounded bg-blue-600 px-3 py-2 text-white"
                onClick={buildBatch}
              >
                Build Merkle batch
              </button>
            </div>
            <div className="space-y-2 text-sm">
              {batches.map((batch) => (
                <div key={batch.id} className="rounded bg-slate-50 p-2">
                  <p>
                    <a href={`/b/${batch.id}`}>{batch.id}</a> | {batch.status}
                  </p>
                  <p className="break-all">Root: {batch.merkle_root}</p>
                </div>
              ))}
              {batches.length === 0 && <p>No batches yet.</p>}
            </div>
          </section>

          <section className="rounded border bg-white p-4">
            <h3 className="mb-3 text-lg font-semibold">Receipts</h3>
            <div className="space-y-2 text-sm">
              {receipts.map((receipt) => (
                <div key={receipt.id} className="rounded bg-slate-50 p-2">
                  <p>
                    <a href={`/r/${receipt.id}`}>{receipt.id}</a> | {receipt.hash_algorithm} |
                    {" "}
                    {receipt.anchor_status}
                  </p>
                  <p className="break-all">{receipt.hash_value}</p>
                </div>
              ))}
              {receipts.length === 0 && <p>No receipts yet.</p>}
            </div>
          </section>

          <section className="rounded border bg-white p-4">
            <h3 className="mb-3 text-lg font-semibold">Disputes</h3>
            <div className="space-y-3 text-sm">
              {disputes.map((dispute) => (
                <div key={dispute.id} className="rounded bg-slate-50 p-3">
                  <p>
                    {dispute.id} | <a href={`/r/${dispute.receipt_id}`}>{dispute.receipt_id}</a>
                  </p>
                  <p>Reason: {dispute.reason}</p>
                  <p>Status: {dispute.status}</p>
                  <div className="mt-2 flex gap-2">
                    <select
                      value={dispute.status}
                      onChange={(event) =>
                        updateDisputeStatus(
                          dispute.id,
                          event.target.value as DisputeRow["status"]
                        )
                      }
                      className="rounded border px-2 py-1"
                    >
                      <option value="new">new</option>
                      <option value="reviewing">reviewing</option>
                      <option value="sent_to_arbitrator">sent_to_arbitrator</option>
                      <option value="closed">closed</option>
                    </select>
                  </div>
                </div>
              ))}
              {disputes.length === 0 && <p>No disputes yet.</p>}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
