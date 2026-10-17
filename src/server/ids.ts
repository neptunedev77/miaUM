import { randomBytes } from "node:crypto";

const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

/** Identificador aleatório, não sequencial (25 caracteres [a-z0-9], ~129 bits). Usado em nomes de ficheiros. */
export function createId(length = 25): string {
  const bytes = randomBytes(length);
  let out = "c"; // começa sempre por letra, como os CUID
  for (let i = 1; i < length; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}
