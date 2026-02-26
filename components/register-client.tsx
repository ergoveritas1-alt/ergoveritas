"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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

type QueueItem = {
  key: string;
  file: File;
  displayName: string;
};

type EntryFile = {
  isFile: true;
  isDirectory: false;
  name: string;
  file: (cb: (file: File) => void, err?: (error: unknown) => void) => void;
};

type EntryDirectory = {
  isFile: false;
  isDirectory: true;
  name: string;
  createReader: () => {
    readEntries: (cb: (entries: Entry[]) => void, err?: (error: unknown) => void) => void;
  };
};

type Entry = EntryFile | EntryDirectory;

declare global {
  interface Window {
    getQueuedFiles?: () => File[];
    onRegisterClick?: () => void;
  }
}

const LARGE_FILE_BYTES = 200 * 1024 * 1024;

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

function formatBytes(bytes: number): string {
  if (bytes === 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i += 1;
  }

  return `${value.toFixed(value >= 100 || i === 0 ? 0 : 1)} ${units[i]}`;
}

function buildQueueKey(file: File, displayName: string): string {
  return `${displayName}|${file.size}|${file.lastModified}`;
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

async function readEntriesRecursive(entry: Entry, prefix = ""): Promise<Array<{ file: File; path: string }>> {
  if (entry.isFile) {
    return new Promise((resolve) => {
      entry.file(
        (file) => {
          const path = prefix ? `${prefix}${file.name}` : file.name;
          resolve([{ file, path }]);
        },
        () => resolve([])
      );
    });
  }

  const reader = entry.createReader();
  const allChildren: Entry[] = [];

  while (true) {
    const batch = await new Promise<Entry[]>((resolve) => {
      reader.readEntries(resolve, () => resolve([]));
    });
    if (batch.length === 0) {
      break;
    }
    allChildren.push(...batch);
  }

  const collected: Array<{ file: File; path: string }> = [];
  for (const child of allChildren) {
    const childPrefix = `${prefix}${entry.name}/`;
    const nested = await readEntriesRecursive(child, childPrefix);
    collected.push(...nested);
  }
  return collected;
}

export function RegisterClient() {
  const queueMapRef = useRef<Map<string, QueueItem>>(new Map());
  const dragDepthRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const algorithmMenuRef = useRef<HTMLDivElement | null>(null);
  const visibilityMenuRef = useRef<HTMLDivElement | null>(null);

  const [algorithm, setAlgorithm] = useState<Algorithm>("sha256");
  const [isAlgorithmMenuOpen, setIsAlgorithmMenuOpen] = useState(false);
  const [isVisibilityMenuOpen, setIsVisibilityMenuOpen] = useState(false);
  const [visibility, setVisibility] = useState<"public" | "private" | "unlisted">(
    "public"
  );
  const [showLargeFileModal, setShowLargeFileModal] = useState(false);
  const [isHashing, setIsHashing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hashValue, setHashValue] = useState<string>("");
  const [elapsedSeconds, setElapsedSeconds] = useState<number | null>(null);
  const [throughputMbps, setThroughputMbps] = useState<number | null>(null);
  const [submitResult, setSubmitResult] = useState<ReceiptResponse | null>(null);
  const [error, setError] = useState<string>("");
  const [inlineWarning, setInlineWarning] = useState<string>("");
  const [queueVersion, setQueueVersion] = useState(0);

  const queueItems = useMemo(
    () => Array.from(queueMapRef.current.values()),
    [queueVersion]
  );

  const queuedFiles = useMemo(() => queueItems.map((item) => item.file), [queueItems]);
  const primaryFile = queuedFiles[0] ?? null;

  const fileSizeMB = useMemo(() => {
    if (!primaryFile) {
      return 0;
    }
    return primaryFile.size / (1024 * 1024);
  }, [primaryFile]);

  const estimateSeconds = useMemo(() => {
    if (!primaryFile) {
      return 0;
    }
    return fileSizeMB / 150;
  }, [primaryFile, fileSizeMB]);

  const queueSummary = useMemo(() => {
    const totalBytes = queuedFiles.reduce((sum, file) => sum + file.size, 0);
    return {
      totalFiles: queuedFiles.length,
      totalBytes
    };
  }, [queuedFiles]);

  const canHash = Boolean(primaryFile) && !isHashing;
  const canSubmit = Boolean(hashValue) && !isHashing;
  const algorithmLabel = algorithm === "sha256" ? "SHA-256" : "SHA-512";
  const visibilityLabel =
    visibility === "public"
      ? "Public"
      : visibility === "private"
        ? "Private"
        : "Unlisted";

  const resetComputedState = () => {
    setHashValue("");
    setSubmitResult(null);
    setError("");
    setProgress(0);
    setElapsedSeconds(null);
    setThroughputMbps(null);
  };

  const commitQueueRender = () => {
    setQueueVersion((v) => v + 1);
  };

  // Queue hook: always returns files in insertion order (Map iteration order).
  const getQueuedFiles = (): File[] => {
    return Array.from(queueMapRef.current.values()).map((item) => item.file);
  };

  const addToQueue = (files: Array<{ file: File; path?: string }>) => {
    if (files.length === 0) {
      return;
    }

    for (const { file, path } of files) {
      const displayName = file.webkitRelativePath || path || file.name;
      const key = buildQueueKey(file, displayName);
      queueMapRef.current.set(key, { key, file, displayName });
    }

    setInlineWarning("");
    resetComputedState();
    commitQueueRender();
  };

  const removeFromQueue = (key: string) => {
    const removed = queueMapRef.current.delete(key);
    if (!removed) {
      return;
    }
    resetComputedState();
    commitQueueRender();
  };

  const onRegisterClick = () => {
    const files = getQueuedFiles();
    if (files.length === 0) {
      setInlineWarning("Add at least one file to continue.");
      return;
    }

    setInlineWarning("");
    const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
    const names = Array.from(queueMapRef.current.values()).map((item) => item.displayName);

    console.log({
      count: files.length,
      totalBytes,
      filenames: names
    });
  };

  const runHash = async (forceLargeFile = false) => {
    setError("");
    setSubmitResult(null);

    if (!primaryFile) {
      setInlineWarning("Add at least one file to continue.");
      return;
    }

    onRegisterClick();

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
      const bytes = await readFileWithProgress(primaryFile, setProgress);
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

  const handleFileInput = (files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }
    addToQueue(Array.from(files).map((file) => ({ file })));
  };

  // Drag and drop handler with folder support (webkit entries) and browser-open prevention.
  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragDepthRef.current = 0;
    setIsDragOver(false);

    const dataTransfer = event.dataTransfer;
    const items = dataTransfer.items ? Array.from(dataTransfer.items) : [];

    if (items.length > 0) {
      const collected: Array<{ file: File; path?: string }> = [];

      for (const item of items) {
        const webkitItem = item as DataTransferItem & {
          webkitGetAsEntry?: () => Entry | null;
        };
        const entry = webkitItem.webkitGetAsEntry?.() as Entry | null;
        if (!entry) {
          continue;
        }
        const files = await readEntriesRecursive(entry);
        for (const result of files) {
          collected.push({ file: result.file, path: result.path });
        }
      }

      if (collected.length > 0) {
        addToQueue(collected);
        return;
      }
    }

    if (dataTransfer.files && dataTransfer.files.length > 0) {
      addToQueue(Array.from(dataTransfer.files).map((file) => ({ file })));
    }
  };

  useEffect(() => {
    const prevent = (event: DragEvent) => {
      event.preventDefault();
    };

    window.addEventListener("dragover", prevent);
    window.addEventListener("drop", prevent);
    return () => {
      window.removeEventListener("dragover", prevent);
      window.removeEventListener("drop", prevent);
    };
  }, []);

  useEffect(() => {
    if (!isAlgorithmMenuOpen && !isVisibilityMenuOpen) {
      return;
    }

    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      const insideAlgorithm = algorithmMenuRef.current?.contains(target) ?? false;
      const insideVisibility = visibilityMenuRef.current?.contains(target) ?? false;
      if (!insideAlgorithm && !insideVisibility) {
        setIsAlgorithmMenuOpen(false);
        setIsVisibilityMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsAlgorithmMenuOpen(false);
        setIsVisibilityMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isAlgorithmMenuOpen, isVisibilityMenuOpen]);

  useEffect(() => {
    window.getQueuedFiles = getQueuedFiles;
    window.onRegisterClick = onRegisterClick;
    return () => {
      delete window.getQueuedFiles;
      delete window.onRegisterClick;
    };
  });

  return (
    <div className="space-y-6">
      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold">Register Content Hash</h2>
        <p className="text-sm text-slate-600">
          File hashing is local in your browser. File bytes are not uploaded.
        </p>

        <div
          className={[
            "relative min-h-[148px] rounded-2xl border p-4 pb-20 transition-colors",
            isDragOver ? "border-slate-400 bg-slate-50" : "border-slate-200 bg-white"
          ].join(" ")}
          onDragEnter={(event) => {
            event.preventDefault();
            dragDepthRef.current += 1;
            setIsDragOver(true);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
            if (dragDepthRef.current === 0) {
              setIsDragOver(false);
            }
          }}
          onDrop={handleDrop}
          aria-label="File drop zone"
        >
          <div className="absolute bottom-4 left-4 flex items-center gap-2">
            <div className="group relative">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-transparent bg-transparent text-2xl leading-none text-slate-500 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2"
                aria-label="Register content"
              >
                +
              </button>
              <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 opacity-0 shadow-sm transition group-hover:opacity-100">
                Register content
              </span>
            </div>

            <div className="group relative" ref={algorithmMenuRef}>
              <div className="pointer-events-none absolute -top-9 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 opacity-0 shadow-sm transition group-hover:opacity-100">
                Select hash algorithm
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsAlgorithmMenuOpen((open) => !open);
                    setIsVisibilityMenuOpen(false);
                  }}
                  aria-label="Hash algorithm"
                  aria-expanded={isAlgorithmMenuOpen}
                  className="inline-flex h-10 items-center rounded-full border border-transparent bg-transparent pl-3 pr-8 text-sm text-slate-600 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2"
                >
                  {algorithmLabel}
                </button>
                <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-700">
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </span>

                {isAlgorithmMenuOpen && (
                  <div className="absolute bottom-full left-0 z-20 mb-2 w-56 rounded-2xl border border-slate-700 bg-slate-900 p-2 text-sm text-slate-100 shadow-lg">
                    <p className="px-2 pb-2 text-xs text-slate-400">Select hash</p>
                    {[
                      { value: "sha256", label: "SHA-256" },
                      { value: "sha512", label: "SHA-512" }
                    ].map((item) => {
                      const isSelected = algorithm === item.value;
                      return (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => {
                            setAlgorithm(item.value as Algorithm);
                            setIsAlgorithmMenuOpen(false);
                          }}
                          className="flex w-full items-center justify-between rounded-xl px-2 py-2 text-left text-sm transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
                        >
                          <span>{item.label}</span>
                          <span className={isSelected ? "text-white" : "invisible"}>✓</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="group relative" ref={visibilityMenuRef}>
              <div className="pointer-events-none absolute -top-9 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 opacity-0 shadow-sm transition group-hover:opacity-100">
                Visibility
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsVisibilityMenuOpen((open) => !open);
                    setIsAlgorithmMenuOpen(false);
                  }}
                  aria-label="Visibility"
                  aria-expanded={isVisibilityMenuOpen}
                  className="inline-flex h-10 items-center rounded-full border border-transparent bg-transparent pl-3 pr-8 text-sm text-slate-600 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2"
                >
                  {visibilityLabel}
                </button>
                <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-700">
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </span>

                {isVisibilityMenuOpen && (
                  <div className="absolute bottom-full left-0 z-20 mb-2 w-56 rounded-2xl border border-slate-700 bg-slate-900 p-2 text-sm text-slate-100 shadow-lg">
                    <p className="px-2 pb-2 text-xs text-slate-400">Select Visibliity</p>
                    {[
                      { value: "public", label: "Public" },
                      { value: "private", label: "Private" },
                      { value: "unlisted", label: "Unlisted" }
                    ].map((item) => {
                      const isSelected = visibility === item.value;
                      return (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => {
                            setVisibility(item.value as "public" | "private" | "unlisted");
                            setIsVisibilityMenuOpen(false);
                          }}
                          className="flex w-full items-center justify-between rounded-xl px-2 py-2 text-left text-sm transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
                        >
                          <span>{item.label}</span>
                          <span className={isSelected ? "text-white" : "invisible"}>✓</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-900">Register content</p>
            <p className="text-sm text-slate-600">
              Drag &amp; drop files (or folders) here, or click +
            </p>
            <p className="text-xs text-slate-500">
              Hashing is local in your browser. File bytes are not uploaded.
            </p>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          hidden
          onChange={(event) => {
            handleFileInput(event.target.files);
            event.currentTarget.value = "";
          }}
        />

        {inlineWarning && <p className="text-sm text-red-700">{inlineWarning}</p>}

        <div className="overflow-hidden rounded-xl border border-slate-200">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            <p>Queued for local hashing</p>
            <p>
              {queueSummary.totalFiles} file{queueSummary.totalFiles === 1 ? "" : "s"} •{" "}
              {formatBytes(queueSummary.totalBytes)}
            </p>
          </div>
          <ul className="max-h-80 divide-y divide-slate-200 overflow-auto">
            {queueItems.length === 0 && (
              <li className="px-3 py-3 text-sm text-slate-500">No files queued yet.</li>
            )}
            {queueItems.map((item) => (
              <li key={item.key} className="flex items-start justify-between gap-3 px-3 py-3">
                <div className="min-w-0 space-y-1">
                  <p className="truncate text-sm text-slate-900" title={item.displayName}>
                    {item.displayName}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatBytes(item.file.size)} • {new Date(item.file.lastModified).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {item.file.size >= LARGE_FILE_BYTES && (
                    <span className="rounded-full border border-slate-300 px-2 py-0.5 text-xs text-slate-700">
                      200MB+ warning
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeFromQueue(item.key)}
                    className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {primaryFile && (
          <div className="rounded bg-slate-50 p-3 text-sm">
            <p>
              Primary file for hashing:{" "}
              <span className="font-medium">{queueItems[0]?.displayName ?? primaryFile.name}</span>
            </p>
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
