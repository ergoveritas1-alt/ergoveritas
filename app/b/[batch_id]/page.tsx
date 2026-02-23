import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export default async function BatchPage({
  params
}: {
  params: { batch_id: string };
}) {
  const batch = await prisma.batch.findUnique({
    where: { id: params.batch_id }
  });

  if (!batch) {
    notFound();
  }

  const receiptIds = JSON.parse(batch.receipt_ids_json) as string[];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Batch {batch.id}</h1>
      <section className="space-y-2 rounded border bg-white p-4 text-sm">
        <p>
          <span className="font-medium">Merkle Root:</span> {batch.merkle_root}
        </p>
        <p>
          <span className="font-medium">Status:</span> {batch.status}
        </p>
        <p>
          <span className="font-medium">Created At:</span> {batch.created_at.toISOString()}
        </p>
      </section>

      <section className="rounded border bg-white p-4 text-sm">
        <h2 className="mb-2 text-lg font-semibold">Included Receipts</h2>
        <ul className="space-y-1">
          {receiptIds.map((receiptId) => (
            <li key={receiptId}>
              <Link href={`/r/${receiptId}`}>{receiptId}</Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
