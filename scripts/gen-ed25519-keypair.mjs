import { generateKeyPairSync } from "node:crypto";

const { privateKey, publicKey } = generateKeyPairSync("ed25519");

const privateDerB64 = privateKey
  .export({ type: "pkcs8", format: "der" })
  .toString("base64");

const publicDerB64 = publicKey
  .export({ type: "spki", format: "der" })
  .toString("base64");

console.log(`ERGOVERITAS_ED25519_PRIVATE_KEY_DER_B64="${privateDerB64}"`);
console.log(`ERGOVERITAS_ED25519_PUBLIC_KEY_DER_B64="${publicDerB64}"`);
