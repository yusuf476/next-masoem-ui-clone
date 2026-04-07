import { createHash, randomUUID } from "crypto";

export function hashPassword(value) {
  return createHash("sha256").update(value).digest("hex");
}

export function createToken() {
  return randomUUID();
}
