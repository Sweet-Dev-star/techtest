import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/**
 * scrypt from Node's standard library. Cost parameters are stored with each
 * hash so they can be raised later without invalidating existing passwords.
 */

const PARAMS = { N: 16384, r: 8, p: 1, keyLength: 64 } as const;
const MAX_MEM = 64 * 1024 * 1024;

/** Returns `scrypt$N$r$p$salt$key`, all base64. */
export function hashPassword(plain: string): string {
  const salt = randomBytes(16);
  const key = scryptSync(plain, salt, PARAMS.keyLength, {
    N: PARAMS.N,
    r: PARAMS.r,
    p: PARAMS.p,
    maxmem: MAX_MEM,
  });

  return ["scrypt", PARAMS.N, PARAMS.r, PARAMS.p, salt.toString("base64"), key.toString("base64")].join(
    "$",
  );
}

/** Constant-time comparison. Returns false rather than throwing on a malformed hash. */
export function verifyPassword(plain: string, stored: string): boolean {
  const parts = String(stored).split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;

  const [, n, r, p, saltB64, keyB64] = parts;
  const salt = Buffer.from(saltB64 ?? "", "base64");
  const expected = Buffer.from(keyB64 ?? "", "base64");

  let actual: Buffer;
  try {
    actual = scryptSync(plain, salt, expected.length, {
      N: Number(n),
      r: Number(r),
      p: Number(p),
      maxmem: MAX_MEM,
    });
  } catch {
    return false;
  }

  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
