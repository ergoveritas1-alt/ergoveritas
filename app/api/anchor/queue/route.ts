import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { queueAnchorSchema } from "@/lib/zod";
import { enforcePostRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const rateLimited = enforcePostRateLimit(request, "anchor_queue_post");
  if (rateLimited) {
    return rateLimited;
  }

  const body = await request.json().catch(() => null);
  const parsed = queueAnchorSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const receipt = await prisma.receipt.findUnique({
    where: { id: parsed.data.receipt_id }
  });

  if (!receipt) {
    return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
  }

  const updated = await prisma.receipt.update({
    where: { id: parsed.data.receipt_id },
    data: {
      anchor_status: "queued"
    }
  });

  return NextResponse.json({
    receipt_id: updated.id,
    anchor_status: updated.anchor_status
  });
}
