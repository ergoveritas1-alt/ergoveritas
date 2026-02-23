import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildLeaf, buildMerkleRoot } from "@/lib/merkle";
import { requireAdmin } from "@/lib/admin";
import { enforcePostRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) {
    return unauthorized;
  }

  const rateLimited = enforcePostRateLimit(request, "anchor_build_post");
  if (rateLimited) {
    return rateLimited;
  }

  const receipts = await prisma.receipt.findMany({
    where: { anchor_status: "queued" },
    orderBy: { created_at: "asc" },
    take: 1000
  });

  if (receipts.length === 0) {
    return NextResponse.json({ error: "No queued receipts" }, { status: 400 });
  }

  const leaves = receipts.map((receipt) =>
    buildLeaf(receipt.hash_algorithm, receipt.hash_value)
  );
  const merkleRoot = buildMerkleRoot(leaves);
  const receiptIds = receipts.map((receipt) => receipt.id);

  const batch = await prisma.$transaction(async (tx) => {
    const created = await tx.batch.create({
      data: {
        merkle_root: merkleRoot,
        status: "built",
        receipt_ids_json: JSON.stringify(receiptIds)
      }
    });

    await tx.receipt.updateMany({
      where: { id: { in: receiptIds } },
      data: {
        anchor_status: "built",
        anchor_batch_id: created.id
      }
    });

    return created;
  });

  return NextResponse.json({
    batch_id: batch.id,
    merkle_root: batch.merkle_root,
    receipt_count: receiptIds.length,
    status: batch.status
  });
}
