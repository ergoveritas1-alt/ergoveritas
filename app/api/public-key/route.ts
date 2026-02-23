import { NextResponse } from "next/server";
import { getPublicKeyInfo } from "@/lib/crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(getPublicKeyInfo());
  } catch {
    return NextResponse.json(
      { error: "Public key not configured" },
      { status: 500 }
    );
  }
}
