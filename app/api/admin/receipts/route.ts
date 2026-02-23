import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) {
    return unauthorized;
  }

  const receipts = await prisma.receipt.findMany({
    orderBy: { created_at: "desc" },
    take: 200
  });

  return NextResponse.json({
    receipts: receipts.map((receipt) => ({
      id: receipt.id,
      hash_algorithm: receipt.hash_algorithm,
      hash_value: receipt.hash_value,
      visibility: receipt.visibility,
      created_at: receipt.created_at.toISOString(),
      anchor_status: receipt.anchor_status,
      anchor_batch_id: receipt.anchor_batch_id
    }))
  });
}
