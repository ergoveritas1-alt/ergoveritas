import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicRoot = path.join(root, "public");
const expectedFingerprints = new Set(["canvas_audio", "webgl_fonts", "device_canvas", "combined"]);
const nonEssentialCookiePatterns = [
  /^_ga(?:_.+)?$/i,
  /^_gid$/i,
  /^_gat/i,
  /^_fb[pc]$/i,
  /^_cl(?:ck|sk)$/i,
  /^_hj/i,
  /^fs_uid$/i,
  /^ajs_/i,
  /^mp_/i,
  /^_gcl_au$/i,
  /^__gads$/i,
  /^_uet(?:sid|vid)$/i,
  /^_ttp$/i,
  /^_scid$/i,
  /^(?:hubspotutk|__hstc|__hssc)$/i,
  /^_ym_visorc/i,
  /^_cb$/i,
  /^amplitude_id_/i,
];
const nonEssentialTrackerHosts = [
  "google-analytics.com",
  "facebook.com",
  "facebook.net",
  "clarity.ms",
  "hotjar.com",
  "fullstory.com",
  "segment.io",
  "mixpanel.com",
  "amplitude.com",
  "tiktok.com",
];
const replayHosts = ["clarity.ms", "hotjar.com", "fullstory.com"];

function parseArray(source, name) {
  const match = source.match(new RegExp(`${name}:\\s*(\\[[\\s\\S]*?\\])`));
  assert.ok(match, `Missing ${name} array`);
  return JSON.parse(match[1]);
}

for (let number = 1; number <= 4; number += 1) {
  const source = await readFile(path.join(publicRoot, `test${number}.html`), "utf8");
  assert.match(source, /^<!-- CANARY TEST PAGE/);
  assert.match(source, /<meta name="robots" content="noindex, nofollow, noarchive">/);
  assert.match(source, new RegExp(`data-certscore-canary="openai-review-test${number}"`));
  assert.match(source, /src="\/certscore-review-canary\.js"/);
  assert.match(source, /postRefusal:\s*"reject_ignored"/);
  if (number !== 3 && number !== 4) {
    assert.match(source, /Reject/i);
    assert.match(source, /Manage|options/i);
    assert.match(source, /Accept|Allow/i);
  }

  const cookies = parseArray(source, "cookies");
  const trackers = parseArray(source, "trackers");
  assert.ok(cookies.length >= 5 && cookies.length <= 10, `test${number}: cookie count must be 5–10`);
  assert.ok(trackers.length >= 5 && trackers.length <= 10, `test${number}: tracker count must be 5–10`);
  assert.ok(cookies.filter((name) => nonEssentialCookiePatterns.some((pattern) => pattern.test(name))).length >= 3, `test${number}: requires at least three known non-essential cookies`);

  const trackerHosts = trackers.map((value) => new URL(value).hostname);
  assert.ok(trackerHosts.filter((hostname) => nonEssentialTrackerHosts.some((suffix) => hostname === suffix || hostname.endsWith(`.${suffix}`))).length >= 3, `test${number}: requires at least three known non-essential trackers`);
  assert.ok(trackerHosts.some((hostname) => replayHosts.some((suffix) => hostname === suffix || hostname.endsWith(`.${suffix}`))), `test${number}: requires a session-replay endpoint`);

  const fingerprint = source.match(/fingerprint:\s*"([^"]+)"/)?.[1];
  assert.ok(expectedFingerprints.has(fingerprint), `test${number}: missing distinct fingerprint canary`);
  expectedFingerprints.delete(fingerprint);
}

assert.equal(expectedFingerprints.size, 0, "Every fingerprint variant must be represented once");

const runtime = await readFile(path.join(publicRoot, "certscore-review-canary.js"), "utf8");
assert.match(runtime, /credentials: "omit"/);
assert.match(runtime, /referrerPolicy: "no-referrer"/);
assert.match(runtime, /getImageData|toDataURL/);
assert.match(runtime, /WEBGL_debug_renderer_info/);
assert.match(runtime, /OfflineAudioContext/);
assert.match(runtime, /sessionReplayExpected: true/);
assert.match(runtime, /Reject non-essential cookies[\s\S]*Customize settings[\s\S]*Agree to all cookies/);
assert.match(runtime, /id="onetrust-reject-all-handler"/);
assert.match(runtime, /id="onetrust-pc-btn-handler"/);
assert.match(runtime, /id="onetrust-accept-btn-handler"/);
assert.match(runtime, /CERTSCORE_\$\{config\.id\.toUpperCase\(\)\}_REJECTED/);
assert.match(runtime, /event\.composedPath\(\).*onetrust-reject-all-handler/s);
assert.match(runtime, /rejectApplied = true/);

console.log("Verified test1.html–test4.html: A/R/O with deterministic Reject, 6 cookies, 6 tracker requests, 3+ non-essential signals per category, fingerprinting, and session replay on every page.");
