import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createReceiptSchema } from "@/lib/zod";
import { buildReceiptPayload } from "@/lib/canonical";
import { getKid, signReceiptPayload } from "@/lib/crypto";
import { enforcePostRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const rateLimited = enforcePostRateLimit(request, "receipts_post");
  if (rateLimited) {
    return rateLimited;
  }

  const body = await request.json().catch(() => null);
  const parsed = createReceiptSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const receiptId = randomUUID();
  const createdAt = new Date();

  const payload = buildReceiptPayload({
    receipt_id: receiptId,
    hash_algorithm: parsed.data.hash_algorithm,
    hash_value: parsed.data.hash_value,
    created_at: createdAt.toISOString(),
    visibility: parsed.data.visibility
  });

  const signature = signReceiptPayload(payload);
  const kid = getKid();

  try {
    const receipt = await prisma.receipt.create({
      data: {
        id: receiptId,
        hash_algorithm: parsed.data.hash_algorithm,
        hash_value: parsed.data.hash_value,
        visibility: parsed.data.visibility,
        created_at: createdAt,
        signature_b64: signature,
        kid
      }
    });

    return NextResponse.json({
      payload,
      signature,
      kid,
      alg: "Ed25519",
      anchor_status: receipt.anchor_status,
      anchor_batch_id: receipt.anchor_batch_id
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const existing = await prisma.receipt.findUnique({
        where: {
          hash_algorithm_hash_value: {
            hash_algorithm: parsed.data.hash_algorithm,
            hash_value: parsed.data.hash_value
          }
        }
      });

      return NextResponse.json(
        {
          error: "Receipt already exists for this hash",
          existing_receipt_id: existing?.id ?? null
        },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: "Failed to create receipt" }, { status: 500 });
  }
}
