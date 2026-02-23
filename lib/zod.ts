import { z } from "zod";

export const hashAlgorithmSchema = z.enum(["sha256", "sha512"]);

const hexSchema = z
  .string()
  .regex(/^[a-fA-F0-9]+$/, "hash_value must be hex")
  .transform((value) => value.toLowerCase());

export const createReceiptSchema = z
  .object({
    hash_algorithm: hashAlgorithmSchema,
    hash_value: hexSchema,
    visibility: z.enum(["public", "private", "unlisted"]).default("public")
  })
  .superRefine((data, ctx) => {
    const expected = data.hash_algorithm === "sha256" ? 64 : 128;
    if (data.hash_value.length !== expected) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["hash_value"],
        message: `hash_value must be ${expected} hex chars for ${data.hash_algorithm}`
      });
    }
  });

export const verifyQuerySchema = z
  .object({
    hash_algorithm: hashAlgorithmSchema,
    hash_value: hexSchema
  })
  .superRefine((data, ctx) => {
    const expected = data.hash_algorithm === "sha256" ? 64 : 128;
    if (data.hash_value.length !== expected) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["hash_value"],
        message: `hash_value must be ${expected} hex chars for ${data.hash_algorithm}`
      });
    }
  });

export const queueAnchorSchema = z.object({
  receipt_id: z.string().min(1)
});

export const createDisputeSchema = z.object({
  receipt_id: z.string().min(1),
  reason: z.string().min(3).max(200),
  details: z.string().max(2000).optional(),
  contact_email: z.string().email(),
  evidence_urls: z.array(z.string().url()).max(10).optional(),
  wants_idv: z.boolean().default(false)
});

export const updateDisputeStatusSchema = z.object({
  status: z.enum(["new", "reviewing", "sent_to_arbitrator", "closed"])
});

export const receiptIdSchema = z.object({
  id: z.string().min(1)
});
