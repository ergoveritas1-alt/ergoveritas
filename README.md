# ErgoVeritas.com (MVP)

Privacy-first content hash registry with signed proof-of-existence receipts.

## Folder Structure Proposal

```text
.
├── README.md
├── package.json
├── next.config.mjs
├── tsconfig.json
├── postcss.config.mjs
├── tailwind.config.ts
├── .env.example
├── .gitignore
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── scripts/
│   └── gen-ed25519-keypair.mjs
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   ├── about/page.tsx
│   ├── register/page.tsx
│   ├── verify/page.tsx
│   ├── admin/page.tsx
│   ├── r/[receipt_id]/page.tsx
│   ├── report/[receipt_id]/page.tsx
│   ├── b/[batch_id]/page.tsx
│   └── api/
│       ├── receipts/route.ts
│       ├── receipts/[id]/route.ts
│       ├── verify/route.ts
│       ├── public-key/route.ts
│       ├── anchor/queue/route.ts
│       ├── anchor/build/route.ts
│       ├── disputes/route.ts
│       └── admin/
│           ├── receipts/route.ts
│           ├── disputes/route.ts
│           ├── disputes/[id]/route.ts
│           └── batches/route.ts
├── components/
│   ├── register-client.tsx
│   ├── verify-client.tsx
│   ├── receipt-actions.tsx
│   ├── signature-verify.tsx
│   └── admin-client.tsx
├── lib/
│   ├── prisma.ts
│   ├── env.ts
│   ├── zod.ts
│   ├── crypto.ts
│   ├── canonical.ts
│   ├── rate-limit.ts
│   ├── admin.ts
│   ├── merkle.ts
│   └── types.ts
└── middleware.ts
```

## Stack Overview

- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS
- Prisma ORM
- SQLite (local dev)
- Zod validation
- `tweetnacl` (browser verification)
- Node `crypto` (server signing)
- Vercel-compatible deployment target

MVP principle:
- Browser computes hash locally with `crypto.subtle.digest()`
- Server receives only hash + minimal metadata
- No file uploads

## Environment Setup

Create `.env.local`:

```bash
DATABASE_URL="file:./dev.db"
ADMIN_PASSWORD="change-me"
ERGOVERITAS_ED25519_PRIVATE_KEY_DER_B64=""
ERGOVERITAS_ED25519_PUBLIC_KEY_DER_B64=""
```

You can also copy from `.env.example`.

## Generate Ed25519 Keys

Script:

```bash
node scripts/gen-ed25519-keypair.mjs
```

This prints:
- `ERGOVERITAS_ED25519_PRIVATE_KEY_DER_B64`
- `ERGOVERITAS_ED25519_PUBLIC_KEY_DER_B64`

Paste values into `.env.local`.

Implementation details:
- uses `generateKeyPairSync("ed25519")`
- private key export: DER `pkcs8` base64
- public key export: DER `spki` base64

## Install and Run

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

App runs at `http://localhost:3000`.

## Prisma Migration

```bash
npm run prisma:migrate
```

This creates local SQLite database and applies migrations.

## Core Data Model

### Receipt

- `id` (string)
- `hash_algorithm` (`sha256` | `sha512`)
- `hash_value` (hex)
- `visibility` (string)
- `created_at` (DateTime)
- `signature_b64` (base64)
- `kid` (string)
- `anchor_status` (`none` | `queued` | `built` | `anchored` | `failed`)
- `anchor_batch_id` (nullable string)

Unique constraint:
- `@@unique([hash_algorithm, hash_value])`

### Batch

- `id` (string)
- `merkle_root` (hex)
- `created_at` (DateTime)
- `status` (`built` | `submitted` | `confirmed`)
- `receipt_ids_json` (JSON string array)

### Dispute

- `id` (string)
- `receipt_id` (string)
- `reason` (string)
- `details` (nullable string)
- `contact_email` (string)
- `evidence_urls` (nullable JSON string array)
- `wants_idv` (boolean)
- `status` (`new` | `reviewing` | `sent_to_arbitrator` | `closed`)
- `created_at` (DateTime)

## Canonical Receipt Payload (Signing Contract)

Server signs exactly this JSON key order:

```json
{
  "receipt_id": "...",
  "hash_algorithm": "sha256",
  "hash_value": "...",
  "created_at": "2026-02-23T00:00:00.000Z",
  "visibility": "public"
}
```

Signature algorithm:
- Ed25519

Stored signature:
- base64

Download JSON shape:

```json
{
  "payload": {"receipt_id":"...","hash_algorithm":"sha256","hash_value":"...","created_at":"...","visibility":"public"},
  "signature": "...",
  "kid": "ev_ab12cd34",
  "alg": "Ed25519"
}
```

## KID and Public Key API

KID format:
- `ev_` + first 8 hex chars of `sha256(public_key_der_bytes)`

`GET /api/public-key` returns:

```json
{
  "kid": "ev_ab12cd34",
  "alg": "Ed25519",
  "public_key_der_b64": "...",
  "public_key_raw_b64": "..."
}
```

`public_key_raw_b64` is derived from `publicKey.export({ format: "jwk" }).x`.

## Hashing UX Rules (`/register`)

- Algorithms: SHA-256 (default), SHA-512
- Estimate before hashing:
  - `seconds = file_size_MB / 150`
- If file > 200MB, show modal text:
  - `Large files may take time. Proceed?`
- Show progress bar while reading file
- Show elapsed time and throughput after completion
- Never send file bytes to server

## API Endpoints

### `POST /api/receipts`
Create signed receipt from hash + metadata.

### `GET /api/receipts/:id`
Fetch receipt by id.

### `GET /api/verify?hash_algorithm=&hash_value=`
Verify by hash lookup.

### `POST /api/disputes`
Create dispute for a receipt.

### `POST /api/anchor/queue`
Body: `{ "receipt_id": "..." }`
Sets receipt `anchor_status = "queued"`.

### `POST /api/anchor/build` (admin)
Build Merkle batch from up to 1000 queued receipts.

Leaf rule:
- `leaf = sha256(hash_algorithm + ":" + hash_value)`

Merkle rule:
- Pairwise hash
- Odd leaf duplicates last
- Continue to one root

Post-build:
- Create batch record
- Set each receipt `anchor_status = "built"`
- Set `anchor_batch_id`

### `GET /api/public-key`
Returns key metadata for verification.

### Admin APIs (header protected)
- `GET /api/admin/receipts`
- `GET /api/admin/disputes`
- `PATCH /api/admin/disputes/:id` (status update)
- `GET /api/admin/batches`

Admin header:
- `x-admin-password: <ADMIN_PASSWORD>`

## UI Pages

- `/` landing with Register + Verify entry points
- `/register` local hashing and receipt submit
- `/verify` search by receipt id or hash+algorithm
- `/r/:receipt_id` receipt details, copy, JSON download, signature verify, queue anchor, report claim
- `/report/:receipt_id` dispute form
- `/b/:batch_id` Merkle root + included receipts
- `/about` product explanation + public key
- `/admin` password-gated admin-lite dashboard

## Security Constraints

- Zod validation on all API inputs
- In-memory rate limiting on POST routes (by IP)
- No raw file storage
- No file upload endpoint
- Avoid logging PII
- Strict TypeScript types

## cURL Examples

Create receipt:

```bash
curl -X POST http://localhost:3000/api/receipts \
  -H 'content-type: application/json' \
  -d '{
    "hash_algorithm":"sha256",
    "hash_value":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    "visibility":"public"
  }'
```

Get receipt:

```bash
curl http://localhost:3000/api/receipts/<RECEIPT_ID>
```

Verify by hash:

```bash
curl "http://localhost:3000/api/verify?hash_algorithm=sha256&hash_value=<HEX_HASH>"
```

Get public key:

```bash
curl http://localhost:3000/api/public-key
```

Queue anchoring:

```bash
curl -X POST http://localhost:3000/api/anchor/queue \
  -H 'content-type: application/json' \
  -d '{"receipt_id":"<RECEIPT_ID>"}'
```

Build anchor batch (admin):

```bash
curl -X POST http://localhost:3000/api/anchor/build \
  -H 'x-admin-password: change-me'
```

Create dispute:

```bash
curl -X POST http://localhost:3000/api/disputes \
  -H 'content-type: application/json' \
  -d '{
    "receipt_id":"<RECEIPT_ID>",
    "reason":"identity dispute",
    "details":"example",
    "contact_email":"user@example.com",
    "evidence_urls":["https://example.com/proof"],
    "wants_idv":false
  }'
```

Admin list disputes:

```bash
curl http://localhost:3000/api/admin/disputes \
  -H 'x-admin-password: change-me'
```

Update dispute status:

```bash
curl -X PATCH http://localhost:3000/api/admin/disputes/<DISPUTE_ID> \
  -H 'content-type: application/json' \
  -H 'x-admin-password: change-me' \
  -d '{"status":"reviewing"}'
```

## Architecture Summary

1. Browser computes digest (`sha256`/`sha512`) using `crypto.subtle.digest`.
2. Browser sends only hash + algorithm + visibility to server.
3. Server writes receipt and signs canonical payload with Ed25519 private key.
4. Receipt view supports local signature verification via `tweetnacl` using `/api/public-key` raw key.
5. Anchoring queue and batch builder provide a clean Merkle seam for future chain integration.
6. Admin-lite is password-gated and header-protected for MVP operations.

## Notes

- Product provides technical proof-of-existence, not legal ownership determination.
- MVP stores minimal metadata and avoids raw content transfer.
