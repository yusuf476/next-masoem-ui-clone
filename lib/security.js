import { createHash, createHmac, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "crypto";

const PASSWORD_SCHEME = "scrypt";
const PASSWORD_KEY_LENGTH = 64;
const SCRYPT_OPTIONS = {
  N: 16384,
  r: 8,
  p: 1,
};

function normalizeString(value) {
  return String(value ?? "");
}

function getTokenSecret() {
  return (
    process.env.AUTH_TOKEN_SECRET?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    "masoem-market-dev-secret"
  );
}

export function hashLegacyPassword(value) {
  return createHash("sha256").update(normalizeString(value)).digest("hex");
}

export function hashPassword(value) {
  const normalizedValue = normalizeString(value);
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(normalizedValue, salt, PASSWORD_KEY_LENGTH, SCRYPT_OPTIONS).toString(
    "hex",
  );

  return `${PASSWORD_SCHEME}$${salt}$${derivedKey}`;
}

export function verifyPassword(value, storedHash) {
  if (!storedHash) {
    return {
      valid: false,
      needsUpgrade: false,
    };
  }

  if (storedHash.startsWith(`${PASSWORD_SCHEME}$`)) {
    const [, salt, expectedHex] = storedHash.split("$");

    if (!salt || !expectedHex) {
      return {
        valid: false,
        needsUpgrade: false,
      };
    }

    const actualHex = scryptSync(
      normalizeString(value),
      salt,
      PASSWORD_KEY_LENGTH,
      SCRYPT_OPTIONS,
    ).toString("hex");
    const expectedBuffer = Buffer.from(expectedHex, "hex");
    const actualBuffer = Buffer.from(actualHex, "hex");

    return {
      valid:
        expectedBuffer.length === actualBuffer.length &&
        timingSafeEqual(expectedBuffer, actualBuffer),
      needsUpgrade: false,
    };
  }

  const legacyHash = hashLegacyPassword(value);
  const expectedBuffer = Buffer.from(storedHash, "utf8");
  const actualBuffer = Buffer.from(legacyHash, "utf8");
  const valid =
    expectedBuffer.length === actualBuffer.length && timingSafeEqual(expectedBuffer, actualBuffer);

  return {
    valid,
    needsUpgrade: valid,
  };
}

export function validatePasswordStrength(value) {
  const password = normalizeString(value);

  if (password.length < 8) {
    return "Password minimal 8 karakter.";
  }

  if (!/[a-z]/i.test(password) || !/\d/.test(password)) {
    return "Password harus mengandung huruf dan angka.";
  }

  return null;
}

export function createToken() {
  return randomUUID();
}

export function createSecretToken(size = 32) {
  return randomBytes(size).toString("hex");
}

export function hashOpaqueToken(value) {
  return createHmac("sha256", getTokenSecret()).update(normalizeString(value)).digest("hex");
}
