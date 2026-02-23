import { NextRequest, NextResponse } from "next/server";
import { getAdminPassword } from "@/lib/env";

export function requireAdmin(request: NextRequest): NextResponse | null {
  const supplied = request.headers.get("x-admin-password");
  if (!supplied || supplied !== getAdminPassword()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
