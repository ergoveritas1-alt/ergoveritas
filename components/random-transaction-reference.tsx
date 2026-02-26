"use client";

import { useMemo } from "react";

function randomHex(length: number): string {
  const chars = "0123456789abcdef";
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export function RandomTransactionReference() {
  const value = useMemo(() => `0x${randomHex(4)}...${randomHex(4)}`, []);
  return <>{value}</>;
}
