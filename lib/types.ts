export type HashAlgorithm = "sha256" | "sha512";

export type AnchorStatus = "none" | "queued" | "built" | "anchored" | "failed";

export type BatchStatus = "built" | "submitted" | "confirmed";

export type DisputeStatus =
  | "new"
  | "reviewing"
  | "sent_to_arbitrator"
  | "closed";

export type ReceiptPayload = {
  receipt_id: string;
  hash_algorithm: HashAlgorithm;
  hash_value: string;
  created_at: string;
  visibility: string;
};
