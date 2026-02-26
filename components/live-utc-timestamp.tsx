"use client";

import { useEffect, useState } from "react";

function formatUtcTimestamp(date: Date): string {
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  const hh = String(date.getUTCHours()).padStart(2, "0");
  const min = String(date.getUTCMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${min} UTC`;
}

export function LiveUtcTimestamp() {
  const [value, setValue] = useState(() => formatUtcTimestamp(new Date()));

  useEffect(() => {
    const timer = window.setInterval(() => {
      setValue(formatUtcTimestamp(new Date()));
    }, 30_000);

    return () => window.clearInterval(timer);
  }, []);

  return <>{value}</>;
}
