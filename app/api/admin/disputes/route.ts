import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) {
    return unauthorized;
  }

  const disputes = await prisma.dispute.findMany({
    orderBy: { created_at: "desc" },
    take: 200
  });

  return NextResponse.json({
    disputes: disputes.map((dispute) => ({
      id: dispute.id,
      receipt_id: dispute.receipt_id,
      reason: dispute.reason,
      details: dispute.details,
      contact_email: dispute.contact_email,
      evidence_urls: dispute.evidence_urls,
      wants_idv: dispute.wants_idv,
      status: dispute.status,
      created_at: dispute.created_at.toISOString()
    }))
  });
}
