function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getAdminPassword(): string {
  return required("ADMIN_PASSWORD");
}

export function getEd25519PrivateDerB64(): string {
  return required("ERGOVERITAS_ED25519_PRIVATE_KEY_DER_B64");
}

export function getEd25519PublicDerB64(): string {
  return required("ERGOVERITAS_ED25519_PUBLIC_KEY_DER_B64");
}
