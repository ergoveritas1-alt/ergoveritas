"use client";

import { signOut, useSession } from "next-auth/react";

export function AuthStatusChip() {
  const { data: session, status } = useSession();
  const email = session?.user?.email;

  if (status !== "authenticated" || !email) {
    return null;
  }

  return (
    <div className="flex justify-end">
      <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700">
        <span className="truncate">Signed in as {email}</span>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="rounded-full border border-slate-300 px-2 py-1 text-[11px] font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
