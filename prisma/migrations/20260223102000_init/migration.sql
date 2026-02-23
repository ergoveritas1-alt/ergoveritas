-- CreateTable
CREATE TABLE "Receipt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hash_algorithm" TEXT NOT NULL,
    "hash_value" TEXT NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'public',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "signature_b64" TEXT NOT NULL,
    "kid" TEXT NOT NULL,
    "anchor_status" TEXT NOT NULL DEFAULT 'none',
    "anchor_batch_id" TEXT,
    CONSTRAINT "Receipt_anchor_batch_id_fkey" FOREIGN KEY ("anchor_batch_id") REFERENCES "Batch" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Batch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "merkle_root" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'built',
    "receipt_ids_json" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Dispute" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "receipt_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "contact_email" TEXT NOT NULL,
    "evidence_urls" TEXT,
    "wants_idv" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'new',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Dispute_receipt_id_fkey" FOREIGN KEY ("receipt_id") REFERENCES "Receipt" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Receipt_hash_algorithm_hash_value_key" ON "Receipt"("hash_algorithm", "hash_value");
