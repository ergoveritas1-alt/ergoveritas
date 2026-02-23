import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { receiptIdSchema, updateDisputeStatusSchema } from "@/lib/zod";

export const runtime = "nodejs";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) {
    return unauthorized;
  }

  const parsedParams = receiptIdSchema.safeParse(params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: "Invalid dispute id" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateDisputeStatusSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const updated = await prisma.dispute.update({
    where: { id: parsedParams.data.id },
    data: { status: parsed.data.status }
  }).catch(() => null);

  if (!updated) {
    return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: updated.id,
    status: updated.status
  });
}
