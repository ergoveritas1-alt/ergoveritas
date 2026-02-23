"use client";

import { useMemo, useState } from "react";

type Algorithm = "sha256" | "sha512";

type ReceiptResponse = {
  payload: {
    receipt_id: string;
    hash_algorithm: Algorithm;
    hash_value: string;
    created_at: string;
    visibility: string;
  };
  signature: string;
  kid: string;
  alg: "Ed25519";
};

function formatSeconds(seconds: number): string {
  if (seconds < 1) {
    return "<1s";
  }
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const rem = Math.round(seconds % 60);
  return `${minutes}m ${rem}s`;
}

function toHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function readFileWithProgress(
  file: File,
  onProgress: (progressPct: number) => void
): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.onprogress = (event) => {
      if (!event.lengthComputable) {
        return;
      }
      const pct = (event.loaded / event.total) * 100;
      onProgress(Math.min(100, Math.max(0, pct)));
    };
    reader.onload = () => {
      if (!reader.result || !(reader.result instanceof ArrayBuffer)) {
        reject(new Error("Unexpected file read result"));
        return;
      }
      onProgress(100);
      resolve(reader.result);
    };
    reader.readAsArrayBuffer(file);
  });
}

export function RegisterClient() {
  const [file, setFile] = useState<File | null>(null);
  const [algorithm, setAlgorithm] = useState<Algorithm>("sha256");
  const [visibility, setVisibility] = useState<"public" | "private" | "unlisted">(
    "public"
  );
  const [showLargeFileModal, setShowLargeFileModal] = useState(false);
  const [isHashing, setIsHashing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hashValue, setHashValue] = useState<string>("");
  const [elapsedSeconds, setElapsedSeconds] = useState<number | null>(null);
  const [throughputMbps, setThroughputMbps] = useState<number | null>(null);
  const [submitResult, setSubmitResult] = useState<ReceiptResponse | null>(null);
  const [error, setError] = useState<string>("");

  const fileSizeMB = useMemo(() => {
    if (!file) {
      return 0;
    }
    return file.size / (1024 * 1024);
  }, [file]);

  const estimateSeconds = useMemo(() => {
    if (!file) {
      return 0;
    }
    return fileSizeMB / 150;
  }, [file, fileSizeMB]);

  const canHash = Boolean(file) && !isHashing;
  const canSubmit = Boolean(hashValue) && !isHashing;

  const runHash = async (forceLargeFile = false) => {
    setError("");
    setSubmitResult(null);

    if (!file) {
      setError("Select a file first.");
      return;
    }

    if (fileSizeMB > 200 && !forceLargeFile) {
      setShowLargeFileModal(true);
      return;
    }

    setShowLargeFileModal(false);
    setIsHashing(true);
    setProgress(0);
    setHashValue("");
    setElapsedSeconds(null);
    setThroughputMbps(null);

    const startedAt = performance.now();

    try {
      const bytes = await readFileWithProgress(file, setProgress);
      const subtleName = algorithm === "sha256" ? "SHA-256" : "SHA-512";
      const digest = await crypto.subtle.digest(subtleName, bytes);
      const finishedAt = performance.now();
      const elapsed = (finishedAt - startedAt) / 1000;
      const throughput = fileSizeMB / Math.max(elapsed, 0.0001);

      setHashValue(toHex(digest));
      setElapsedSeconds(elapsed);
      setThroughputMbps(throughput);
    } catch {
      setError("Failed to hash file.");
    } finally {
      setIsHashing(false);
    }
  };

  const submitReceipt = async () => {
    if (!hashValue) {
      return;
    }

    setError("");
    setSubmitResult(null);

    const response = await fetch("/api/receipts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        hash_algorithm: algorithm,
        hash_value: hashValue,
        visibility
      })
    });

    const json = await response.json().catch(() => null);

    if (!response.ok) {
      if (response.status === 409 && json?.existing_receipt_id) {
        setError(`Receipt already exists: ${json.existing_receipt_id}`);
      } else {
        setError("Failed to submit receipt.");
      }
      return;
    }

    setSubmitResult(json as ReceiptResponse);
  };

  return (
    <div className="space-y-6">
      <section className="space-y-3 rounded border bg-white p-4">
        <h2 className="text-xl font-semibold">Register Content Hash</h2>
        <p className="text-sm text-slate-600">
          File hashing is local in your browser. File bytes are not uploaded.
        </p>

        <div className="space-y-2">
          <label className="block text-sm font-medium">File</label>
          <input
            type="file"
            onChange={(event) => {
              const selected = event.target.files?.[0] ?? null;
              setFile(selected);
              setHashValue("");
              setSubmitResult(null);
              setError("");
              setProgress(0);
            }}
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
          <label className="block text-sm font-medium">Visibility</label>
          <select
            value={visibility}
            onChange={(event) =>
              setVisibility(event.target.value as "public" | "private" | "unlisted")
            }
            className="rounded border px-2 py-1"
          >
            <option value="public">Public</option>
            <option value="private">Private</option>
            <option value="unlisted">Unlisted</option>
          </select>
        </div>

        {file && (
          <div className="rounded bg-slate-50 p-3 text-sm">
            <p>File size: {fileSizeMB.toFixed(2)} MB</p>
            <p>Estimated hashing time: {formatSeconds(estimateSeconds)}</p>
          </div>
        )}

        {isHashing && (
          <div className="space-y-2">
            <div className="h-3 w-full overflow-hidden rounded bg-slate-200">
              <div
                className="h-full bg-blue-600 transition-all"
                style={{ width: `${progress.toFixed(1)}%` }}
              />
            </div>
            <p className="text-sm text-slate-700">Reading file: {progress.toFixed(1)}%</p>
          </div>
        )}

        {hashValue && (
          <div className="rounded border border-emerald-200 bg-emerald-50 p-3 text-sm">
            <p className="font-medium">Hash complete</p>
            <p className="break-all">{hashValue}</p>
            {elapsedSeconds !== null && throughputMbps !== null && (
              <p className="mt-1 text-slate-700">
                Elapsed: {elapsedSeconds.toFixed(2)}s | Throughput: {throughputMbps.toFixed(2)} MB/s
              </p>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            className="rounded bg-blue-600 px-4 py-2 text-white disabled:bg-blue-300"
            onClick={() => runHash(false)}
            disabled={!canHash}
          >
            {isHashing ? "Hashing..." : "Compute Hash"}
          </button>

          <button
            type="button"
            className="rounded bg-slate-900 px-4 py-2 text-white disabled:bg-slate-400"
            onClick={submitReceipt}
            disabled={!canSubmit}
          >
            Submit Receipt
          </button>
        </div>
      </section>

      {submitResult && (
        <section className="rounded border border-green-200 bg-green-50 p-4">
          <p className="font-medium">Receipt created</p>
          <p>
            Receipt ID: <a href={`/r/${submitResult.payload.receipt_id}`}>{submitResult.payload.receipt_id}</a>
          </p>
        </section>
      )}

      {error && <p className="text-sm text-red-700">{error}</p>}

      {showLargeFileModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md space-y-4 rounded bg-white p-4">
            <p className="font-medium">Large files may take time. Proceed?</p>
            <div className="flex gap-3">
              <button
                type="button"
                className="rounded bg-blue-600 px-4 py-2 text-white"
                onClick={() => runHash(true)}
              >
                Proceed
              </button>
              <button
                type="button"
                className="rounded border border-slate-300 px-4 py-2"
                onClick={() => setShowLargeFileModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
