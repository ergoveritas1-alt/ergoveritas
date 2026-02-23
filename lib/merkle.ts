import { sha256Hex } from "@/lib/crypto";

export function buildLeaf(hashAlgorithm: string, hashValue: string): string {
  return sha256Hex(`${hashAlgorithm}:${hashValue}`);
}

export function buildMerkleRoot(leaves: string[]): string {
  if (leaves.length === 0) {
    throw new Error("Cannot build Merkle root from zero leaves");
  }

  let level = [...leaves];

  while (level.length > 1) {
    const next: string[] = [];
    for (let i = 0; i < level.length; i += 2) {
      const left = level[i];
      const right = level[i + 1] ?? left;
      const combined = Buffer.concat([
        Buffer.from(left, "hex"),
        Buffer.from(right, "hex")
      ]);
      next.push(sha256Hex(combined));
    }
    level = next;
  }

  return level[0];
}
