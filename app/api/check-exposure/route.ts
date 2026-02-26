import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const COMMON_CRAWL_INDEX_BASE_URL = "https://index.commoncrawl.org";
const COMMON_CRAWL_COLLINFO_URL = `${COMMON_CRAWL_INDEX_BASE_URL}/collinfo.json`;
const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);
const CDX_TIMEOUT_MS = 15000;
const CDX_MAX_ATTEMPTS = 3;
const MAX_INDEX_FALLBACKS = 5;

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

function sanitizeString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function normalizeTargetUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("A URL is required.");
  }

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let parsed: URL;

  try {
    parsed = new URL(withProtocol);
  } catch {
    throw new Error("Enter a valid URL (for example, example.com/page).");
  }

  parsed.hash = "";
  const pathWithQuery = `${parsed.pathname}${parsed.search}` || "/";
  return `${parsed.host}${pathWithQuery}`;
}

async function fetchCrawlInfo(): Promise<CrawlInfo[]> {
  const response = await fetch(COMMON_CRAWL_COLLINFO_URL, {
    method: "GET",
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Common Crawl collinfo request failed (${response.status}).`);
  }

  const payload = (await response.json()) as Array<Record<string, unknown>>;

  return payload
    .map((item) => ({
      id: sanitizeString(item.id) ?? "",
      name: sanitizeString(item.name) ?? "",
      cdxApi: sanitizeString(item["cdx-api"]),
      from: sanitizeString(item.from),
      to: sanitizeString(item.to)
    }))
    .filter((item) => item.id.length > 0)
    .sort((a, b) => b.id.localeCompare(a.id));
}

function parseCdxResponse(text: string): CdxRecord[] {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const parsedRecords: CdxRecord[] = [];

  for (const line of lines) {
    try {
      const record = JSON.parse(line) as Record<string, unknown>;
      parsedRecords.push({
        url: sanitizeString(record.url),
        status: sanitizeString(record.status),
        timestamp: sanitizeString(record.timestamp),
        mime: sanitizeString(record.mime),
        filename: sanitizeString(record.filename),
        offset: sanitizeString(record.offset),
        length: sanitizeString(record.length)
      });
    } catch {
      // Skip non-JSON lines so one bad line does not fail the full response.
    }
  }

  return parsedRecords;
}

function buildCdxUrl(crawl: CrawlInfo, normalizedTargetUrl: string): URL {
  const endpoint = crawl.cdxApi ?? `${COMMON_CRAWL_INDEX_BASE_URL}/${crawl.id}-index`;
  const cdxUrl = new URL(endpoint);
  cdxUrl.searchParams.set("url", normalizedTargetUrl);
  cdxUrl.searchParams.set("output", "json");
  cdxUrl.searchParams.set("fl", "url,status,timestamp,mime,filename,offset,length");
  cdxUrl.searchParams.set("limit", "30");
  return cdxUrl;
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeout);
  }
}

type QueryIndexResult =
  | {
      ok: true;
      response: Response;
      cdxUrl: string;
      attempts: number;
    }
  | {
      ok: false;
      cdxUrl: string;
      attempts: number;
      status: number | null;
      reason: string;
    };

async function queryIndex(crawl: CrawlInfo, normalizedTargetUrl: string): Promise<QueryIndexResult> {
  const cdxUrl = buildCdxUrl(crawl, normalizedTargetUrl).toString();
  let lastStatus: number | null = null;
  let lastReason = "Unknown failure";

  for (let attempt = 1; attempt <= CDX_MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetchWithTimeout(cdxUrl, CDX_TIMEOUT_MS);

      if (response.ok) {
        return { ok: true, response, cdxUrl, attempts: attempt };
      }

      lastStatus = response.status;
      lastReason = `HTTP ${response.status}`;

      if (!RETRYABLE_STATUS_CODES.has(response.status)) {
        return {
          ok: false,
          cdxUrl,
          attempts: attempt,
          status: response.status,
          reason: lastReason
        };
      }
    } catch (error) {
      lastReason = isAbortError(error) ? "request timeout" : "network error";
      lastStatus = null;
    }

    if (attempt < CDX_MAX_ATTEMPTS) {
      await delay(250 * attempt);
    }
  }

  return {
    ok: false,
    cdxUrl,
    attempts: CDX_MAX_ATTEMPTS,
    status: lastStatus,
    reason: lastReason
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const listOnly = searchParams.get("list") === "1";

  try {
    const crawls = await fetchCrawlInfo();
    const defaultIndex = crawls[0]?.id ?? null;

    if (listOnly) {
      return NextResponse.json({ crawls, defaultIndex });
    }

    const rawUrl = searchParams.get("url") ?? "";
    const normalizedTargetUrl = normalizeTargetUrl(rawUrl);
    const requestedIndex = searchParams.get("index");
    const selectedIndex = requestedIndex && requestedIndex.length > 0 ? requestedIndex : defaultIndex;

    if (!selectedIndex) {
      return NextResponse.json(
        { error: "No Common Crawl indexes are currently available." },
        { status: 503 }
      );
    }

    const hasRequestedIndex = crawls.some((crawl) => crawl.id === selectedIndex);
    if (!hasRequestedIndex) {
      return NextResponse.json(
        { error: `Unknown index "${selectedIndex}". Choose a value from collinfo.` },
        { status: 400 }
      );
    }

    const selectedCrawl = crawls.find((crawl) => crawl.id === selectedIndex);
    if (!selectedCrawl) {
      return NextResponse.json(
        { error: `Unknown index "${selectedIndex}". Choose a value from collinfo.` },
        { status: 400 }
      );
    }

    const fallbackCrawls = crawls
      .filter((crawl) => crawl.id !== selectedIndex)
      .slice(0, MAX_INDEX_FALLBACKS);
    const queryCrawls = [selectedCrawl, ...fallbackCrawls];
    const attemptedIndexes: string[] = [];

    let resolvedIndex: string | null = null;
    let resolvedCdxUrl = "";
    let records: CdxRecord[] = [];
    let lastFailure: QueryIndexResult | null = null;
    const notFoundChecks: Array<{ indexId: string; cdxUrl: string }> = [];

    for (const crawl of queryCrawls) {
      attemptedIndexes.push(crawl.id);
      const queryResult = await queryIndex(crawl, normalizedTargetUrl);

      if (!queryResult.ok) {
        if (queryResult.status === 404) {
          notFoundChecks.push({ indexId: crawl.id, cdxUrl: queryResult.cdxUrl });
          continue;
        }
        lastFailure = queryResult;
        continue;
      }

      resolvedIndex = crawl.id;
      resolvedCdxUrl = queryResult.cdxUrl;
      const cdxRawBody = await queryResult.response.text();
      records = parseCdxResponse(cdxRawBody);
      break;
    }

    if (!resolvedIndex) {
      if (notFoundChecks.length > 0 && lastFailure === null) {
        const primaryNotFound = notFoundChecks[0];
        return NextResponse.json({
          inputUrl: rawUrl,
          normalizedTargetUrl,
          selectedIndex,
          resolvedIndex: primaryNotFound.indexId,
          fallbackUsed: notFoundChecks.length > 1,
          attemptedIndexes,
          cdxQueryUrl: primaryNotFound.cdxUrl,
          indexedInCommonCrawl: false,
          totalMatches: 0,
          status200Matches: 0,
          records
        });
      }

      const fallbackStatus = lastFailure?.status;
      const fallbackReason = lastFailure?.reason ?? "unknown";
      return NextResponse.json(
        {
          error:
            fallbackStatus !== null
              ? `CDX query failed (${fallbackStatus}) after retries across recent indexes.`
              : `CDX query failed due to ${fallbackReason} after retries across recent indexes.`,
          selectedIndex,
          attemptedIndexes,
          cdxQueryUrl: lastFailure?.cdxUrl ?? null
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      inputUrl: rawUrl,
      normalizedTargetUrl,
      selectedIndex,
      resolvedIndex,
      fallbackUsed: resolvedIndex !== selectedIndex,
      attemptedIndexes,
      cdxQueryUrl: resolvedCdxUrl,
      indexedInCommonCrawl: records.length > 0,
      totalMatches: records.length,
      status200Matches: records.length,
      records
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
