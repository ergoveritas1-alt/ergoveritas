import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildReceiptPayload } from "@/lib/canonical";
import { receiptIdSchema } from "@/lib/zod";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const parsedParams = receiptIdSchema.safeParse(params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: "Invalid receipt id" }, { status: 400 });
  }

  const receipt = await prisma.receipt.findUnique({
    where: { id: parsedParams.data.id }
  });

  if (!receipt) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const payload = buildReceiptPayload({
    receipt_id: receipt.id,
    hash_algorithm: receipt.hash_algorithm as "sha256" | "sha512",
    hash_value: receipt.hash_value,
    created_at: receipt.created_at.toISOString(),
    visibility: receipt.visibility
  });

  return NextResponse.json({
    payload,
    signature: receipt.signature_b64,
    kid: receipt.kid,
    alg: "Ed25519",
    anchor_status: receipt.anchor_status,
    anchor_batch_id: receipt.anchor_batch_id
  });
}
