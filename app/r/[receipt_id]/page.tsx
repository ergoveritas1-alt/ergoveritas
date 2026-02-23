import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { buildReceiptPayload } from "@/lib/canonical";
import { ReceiptActions } from "@/components/receipt-actions";
import { SignatureVerify } from "@/components/signature-verify";

export const runtime = "nodejs";

export default async function ReceiptPage({
  params
}: {
  params: { receipt_id: string };
}) {
  const receipt = await prisma.receipt.findUnique({
    where: { id: params.receipt_id }
  });

  if (!receipt) {
    notFound();
  }

  const payload = buildReceiptPayload({
    receipt_id: receipt.id,
    hash_algorithm: receipt.hash_algorithm as "sha256" | "sha512",
    hash_value: receipt.hash_value,
    created_at: receipt.created_at.toISOString(),
    visibility: receipt.visibility
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Receipt {receipt.id}</h1>

      <section className="space-y-2 rounded border bg-white p-4 text-sm">
        <p>
          <span className="font-medium">Hash Algorithm:</span> {receipt.hash_algorithm}
        </p>
        <p className="break-all">
          <span className="font-medium">Hash Value:</span> {receipt.hash_value}
        </p>
        <p>
          <span className="font-medium">Created At:</span> {receipt.created_at.toISOString()}
        </p>
        <p>
          <span className="font-medium">Visibility:</span> {receipt.visibility}
        </p>
        <p>
          <span className="font-medium">Anchor Status:</span> {receipt.anchor_status}
        </p>
        {receipt.anchor_batch_id && (
          <p>
            <span className="font-medium">Batch:</span>{" "}
            <Link href={`/b/${receipt.anchor_batch_id}`}>{receipt.anchor_batch_id}</Link>
          </p>
        )}
      </section>

      <ReceiptActions
        payload={payload}
        signature={receipt.signature_b64}
        kid={receipt.kid}
      />

      <SignatureVerify payload={payload} signature={receipt.signature_b64} />

      <div>
        <Link href={`/report/${receipt.id}`}>Report claim</Link>
      </div>
    </div>
  );
}
