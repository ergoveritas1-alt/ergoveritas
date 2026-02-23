import type { HashAlgorithm, ReceiptPayload } from "@/lib/types";

export function buildReceiptPayload(input: {
  receipt_id: string;
  hash_algorithm: HashAlgorithm;
  hash_value: string;
  created_at: string;
  visibility: string;
}): ReceiptPayload {
  return {
    receipt_id: input.receipt_id,
    hash_algorithm: input.hash_algorithm,
    hash_value: input.hash_value,
    created_at: input.created_at,
    visibility: input.visibility
  };
}

export function canonicalReceiptJson(payload: ReceiptPayload): string {
  return JSON.stringify(payload);
}
