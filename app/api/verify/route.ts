import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyQuerySchema } from "@/lib/zod";
import { buildReceiptPayload } from "@/lib/canonical";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const parsed = verifyQuerySchema.safeParse({
    hash_algorithm: request.nextUrl.searchParams.get("hash_algorithm"),
    hash_value: request.nextUrl.searchParams.get("hash_value")
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const receipt = await prisma.receipt.findUnique({
    where: {
      hash_algorithm_hash_value: {
        hash_algorithm: parsed.data.hash_algorithm,
        hash_value: parsed.data.hash_value
      }
    }
  });

  if (!receipt) {
    return NextResponse.json({ exists: false });
  }

  const payload = buildReceiptPayload({
    receipt_id: receipt.id,
    hash_algorithm: receipt.hash_algorithm as "sha256" | "sha512",
    hash_value: receipt.hash_value,
    created_at: receipt.created_at.toISOString(),
    visibility: receipt.visibility
  });

  return NextResponse.json({
    exists: true,
    receipt: {
      payload,
      signature: receipt.signature_b64,
      kid: receipt.kid,
      alg: "Ed25519"
    }
  });
}
