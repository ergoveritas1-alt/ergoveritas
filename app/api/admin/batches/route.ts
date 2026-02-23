import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) {
    return unauthorized;
  }

  const batches = await prisma.batch.findMany({
    orderBy: { created_at: "desc" },
    take: 200
  });

  return NextResponse.json({
    batches: batches.map((batch) => ({
      id: batch.id,
      merkle_root: batch.merkle_root,
      status: batch.status,
      receipt_ids_json: batch.receipt_ids_json,
      created_at: batch.created_at.toISOString()
    }))
  });
}
