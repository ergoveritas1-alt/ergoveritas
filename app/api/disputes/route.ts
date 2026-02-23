import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createDisputeSchema } from "@/lib/zod";
import { enforcePostRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const rateLimited = enforcePostRateLimit(request, "disputes_post");
  if (rateLimited) {
    return rateLimited;
  }

  const body = await request.json().catch(() => null);
  const parsed = createDisputeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const receipt = await prisma.receipt.findUnique({
    where: { id: parsed.data.receipt_id },
    select: { id: true }
  });

  if (!receipt) {
    return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
  }

  const dispute = await prisma.dispute.create({
    data: {
      receipt_id: parsed.data.receipt_id,
      reason: parsed.data.reason,
      details: parsed.data.details,
      contact_email: parsed.data.contact_email,
      evidence_urls: parsed.data.evidence_urls
        ? JSON.stringify(parsed.data.evidence_urls)
        : null,
      wants_idv: parsed.data.wants_idv,
      status: "new"
    }
  });

  return NextResponse.json({
    id: dispute.id,
    receipt_id: dispute.receipt_id,
    status: dispute.status,
    created_at: dispute.created_at.toISOString()
  });
}
