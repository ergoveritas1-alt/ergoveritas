"use client";

import { useState } from "react";

export default function ReportPage({
  params
}: {
  params: { receipt_id: string };
}) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [evidenceUrls, setEvidenceUrls] = useState("");
  const [wantsIdv, setWantsIdv] = useState(false);
  const [message, setMessage] = useState("");

  const submit = async () => {
    setMessage("");

    const urls = evidenceUrls
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const response = await fetch("/api/disputes", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        receipt_id: params.receipt_id,
        reason,
        details: details || undefined,
        contact_email: contactEmail,
        evidence_urls: urls.length > 0 ? urls : undefined,
        wants_idv: wantsIdv
      })
    });

    const json = await response.json().catch(() => null);

    if (!response.ok) {
      setMessage(json?.error ?? "Failed to submit report.");
      return;
    }

    setMessage(`Report submitted with ID: ${json.id}`);
  };

  return (
    <div className="space-y-4 rounded border bg-white p-4">
      <h1 className="text-2xl font-semibold">Report claim for {params.receipt_id}</h1>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Reason</label>
        <input
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          className="w-full rounded border px-2 py-1"
          placeholder="reason"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Details (optional)</label>
        <textarea
          value={details}
          onChange={(event) => setDetails(event.target.value)}
          className="min-h-24 w-full rounded border px-2 py-1"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Contact Email</label>
        <input
          value={contactEmail}
          onChange={(event) => setContactEmail(event.target.value)}
          className="w-full rounded border px-2 py-1"
          placeholder="email@example.com"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Evidence URLs (optional, one per line)</label>
        <textarea
          value={evidenceUrls}
          onChange={(event) => setEvidenceUrls(event.target.value)}
          className="min-h-24 w-full rounded border px-2 py-1"
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={wantsIdv}
          onChange={(event) => setWantsIdv(event.target.checked)}
        />
        I want identity verification follow-up.
      </label>

      <button
        type="button"
        className="rounded bg-blue-600 px-4 py-2 text-white"
        onClick={submit}
      >
        Submit report
      </button>

      {message && <p className="text-sm text-slate-700">{message}</p>}
    </div>
  );
}
