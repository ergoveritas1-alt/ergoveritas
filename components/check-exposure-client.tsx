"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type CrawlInfo = {
  id: string;
  name: string;
  cdxApi: string | null;
  from: string | null;
  to: string | null;
};

type CdxRecord = {
  url: string | null;
  status: string | null;
  timestamp: string | null;
  mime: string | null;
  filename: string | null;
  offset: string | null;
  length: string | null;
};

type ListResponse = {
  crawls: CrawlInfo[];
  defaultIndex: string | null;
};

type CheckResponse = {
  inputUrl: string;
  normalizedTargetUrl: string;
  selectedIndex: string;
  resolvedIndex: string;
  fallbackUsed: boolean;
  attemptedIndexes: string[];
  cdxQueryUrl: string;
  indexedInCommonCrawl: boolean;
  totalMatches: number;
  status200Matches: number;
  records: CdxRecord[];
};

function formatTimestamp(raw: string | null): string {
  if (!raw || !/^\d{14}$/.test(raw)) {
    return raw ?? "n/a";
  }

  const year = Number(raw.slice(0, 4));
  const month = Number(raw.slice(4, 6)) - 1;
  const day = Number(raw.slice(6, 8));
  const hours = Number(raw.slice(8, 10));
  const minutes = Number(raw.slice(10, 12));
  const seconds = Number(raw.slice(12, 14));
  const date = new Date(Date.UTC(year, month, day, hours, minutes, seconds));

  return date.toISOString().replace(".000Z", "Z");
}

export function CheckExposureClient() {
  const [url, setUrl] = useState("");
  const [selectedIndex, setSelectedIndex] = useState("");
  const [crawls, setCrawls] = useState<CrawlInfo[]>([]);
  const [isLoadingCrawls, setIsLoadingCrawls] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CheckResponse | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadCrawls() {
      try {
        const response = await fetch("/api/check-exposure?list=1", { cache: "no-store" });
        const payload = (await response.json()) as ListResponse & { error?: string };

        if (!response.ok) {
          throw new Error(payload.error ?? "Failed to load Common Crawl indexes.");
        }

        if (!isMounted) {
          return;
        }

        setCrawls(payload.crawls);
        if (payload.defaultIndex) {
          setSelectedIndex(payload.defaultIndex);
        }
      } catch (loadError) {
        if (isMounted) {
          const message =
            loadError instanceof Error
              ? loadError.message
              : "Failed to load Common Crawl indexes.";
          setError(message);
        }
      } finally {
        if (isMounted) {
          setIsLoadingCrawls(false);
        }
      }
    }

    loadCrawls();

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedCrawlName = useMemo(() => {
    const match = crawls.find((crawl) => crawl.id === selectedIndex);
    return match?.name ?? selectedIndex;
  }, [crawls, selectedIndex]);

  const resolvedCrawlName = useMemo(() => {
    if (!result) {
      return selectedCrawlName;
    }

    const match = crawls.find((crawl) => crawl.id === result.resolvedIndex);
    return match?.name ?? result.resolvedIndex;
  }, [crawls, result, selectedCrawlName]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setResult(null);
    setIsChecking(true);

    try {
      const params = new URLSearchParams();
      params.set("url", url.trim());
      if (selectedIndex) {
        params.set("index", selectedIndex);
      }

      const response = await fetch(`/api/check-exposure?${params.toString()}`, {
        method: "GET",
        cache: "no-store"
      });
      const payload = (await response.json()) as CheckResponse & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Exposure check failed.");
      }

      setResult(payload);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Exposure check failed.";
      setError(message);
    } finally {
      setIsChecking(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/70 sm:p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Common Crawl check</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          Check Exposure
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-700">
          Paste a URL to check whether it appears in a Common Crawl index via the CDX API. A status
          of <strong>200</strong> in returned records indicates the page was crawled.
        </p>
        <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-800">URL to check</span>
            <input
              type="text"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="example.com/your-work"
              required
              className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-800">Common Crawl index</span>
            <select
              value={selectedIndex}
              onChange={(event) => setSelectedIndex(event.target.value)}
              disabled={isLoadingCrawls || crawls.length === 0}
              className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100"
            >
              {crawls.map((crawl) => (
                <option key={crawl.id} value={crawl.id}>
                  {crawl.id} - {crawl.name}
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={isChecking}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-500"
            >
              {isChecking ? "Checking..." : "Check Exposure"}
            </button>
            <p className="text-xs text-slate-500">
              Index source:{" "}
              <a
                href="https://index.commoncrawl.org/collinfo.json"
                target="_blank"
                rel="noreferrer"
                className="underline decoration-slate-400 underline-offset-2"
              >
                index.commoncrawl.org/collinfo.json
              </a>
            </p>
          </div>
        </form>

        {error ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}
      </section>

      {result ? (
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-8">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">Result</h2>
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${
              result.indexedInCommonCrawl
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-amber-200 bg-amber-50 text-amber-800"
            }`}
          >
            {result.indexedInCommonCrawl
              ? "Found records with status 200. This URL was crawled in the selected index."
              : "No status-200 records found in the selected index for this URL."}
          </div>

          <dl className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
              <dt className="text-xs uppercase tracking-wide text-slate-500">Selected index</dt>
              <dd className="mt-1 text-sm text-slate-800">{selectedCrawlName}</dd>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
              <dt className="text-xs uppercase tracking-wide text-slate-500">Resolved index</dt>
              <dd className="mt-1 text-sm text-slate-800">{resolvedCrawlName}</dd>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
              <dt className="text-xs uppercase tracking-wide text-slate-500">URL pattern queried</dt>
              <dd className="mt-1 break-all text-sm text-slate-800">{result.normalizedTargetUrl}</dd>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
              <dt className="text-xs uppercase tracking-wide text-slate-500">Total matches</dt>
              <dd className="mt-1 text-sm text-slate-800">{result.totalMatches}</dd>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
              <dt className="text-xs uppercase tracking-wide text-slate-500">Status 200 matches</dt>
              <dd className="mt-1 text-sm text-slate-800">{result.status200Matches}</dd>
            </div>
          </dl>

          {result.fallbackUsed ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              The selected index did not respond in time. Used fallback index {result.resolvedIndex}
              {" "}after retries across recent indexes.
            </div>
          ) : null}

          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
            CDX query URL:{" "}
            <a
              href={result.cdxQueryUrl}
              target="_blank"
              rel="noreferrer"
              className="break-all underline decoration-slate-400 underline-offset-2"
            >
              {result.cdxQueryUrl}
            </a>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Timestamp</th>
                  <th className="px-3 py-2 font-medium">URL</th>
                  <th className="px-3 py-2 font-medium">warc-filename</th>
                  <th className="px-3 py-2 font-medium">warc-offset</th>
                  <th className="px-3 py-2 font-medium">warc-length</th>
                </tr>
              </thead>
              <tbody>
                {result.records.length > 0 ? (
                  result.records.map((record, index) => (
                    <tr key={`${record.timestamp ?? "unknown"}-${record.url ?? "unknown"}-${index}`}>
                      <td className="border-t border-slate-200 px-3 py-2 text-slate-800">
                        {record.status ?? "n/a"}
                      </td>
                      <td className="border-t border-slate-200 px-3 py-2 text-slate-700">
                        {formatTimestamp(record.timestamp)}
                      </td>
                      <td className="border-t border-slate-200 px-3 py-2 text-slate-700">
                        <span className="block max-w-[20rem] truncate" title={record.url ?? "n/a"}>
                          {record.url ?? "n/a"}
                        </span>
                      </td>
                      <td className="border-t border-slate-200 px-3 py-2 text-slate-700">
                        <span className="block max-w-[18rem] truncate" title={record.filename ?? "n/a"}>
                          {record.filename ?? "n/a"}
                        </span>
                      </td>
                      <td className="border-t border-slate-200 px-3 py-2 text-slate-700">
                        {record.offset ?? "n/a"}
                      </td>
                      <td className="border-t border-slate-200 px-3 py-2 text-slate-700">
                        {record.length ?? "n/a"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="border-t border-slate-200 px-3 py-4 text-slate-600">
                      No rows returned for this query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
