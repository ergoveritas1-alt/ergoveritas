import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">ErgoVeritas</h1>
      <p className="max-w-2xl text-slate-700">
        Privacy-first proof-of-existence registry. Hash your content locally,
        submit only the hash, and receive a signed timestamped receipt.
      </p>
      <p className="max-w-2xl text-sm text-slate-600">
        ErgoVeritas provides technical proof-of-existence records. It does not
        determine legal ownership.
      </p>
      <div className="flex gap-4">
        <Link href="/register" className="rounded bg-blue-600 px-4 py-2 text-white no-underline">
          Register
        </Link>
        <Link href="/verify" className="rounded border border-slate-300 px-4 py-2 no-underline">
          Verify
        </Link>
      </div>
    </div>
  );
}
