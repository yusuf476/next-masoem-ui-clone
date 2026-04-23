import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import path from "node:path";
import test from "node:test";

import {
  authenticateUser,
  getWishlistByUserId,
  registerUser,
  requestPasswordReset,
  resetPasswordWithToken,
  toggleWishlistItem,
} from "../lib/market.js";
import { hashLegacyPassword } from "../lib/security.js";

const dataFile = path.join(process.cwd(), "data", "store.json");
const originalSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const originalSupabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
let initialStoreContent = null;

async function restoreStore() {
  if (initialStoreContent === null) {
    await fs.unlink(dataFile).catch(() => {});
    return;
  }

  await fs.writeFile(dataFile, initialStoreContent, "utf8");
}

async function readStoreFile() {
  const raw = await fs.readFile(dataFile, "utf8");
  return JSON.parse(raw);
}

function createUserPayload(prefix = "tester") {
  const uniqueId = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  return {
    name: "Codex Tester",
    email: `${uniqueId}@example.com`,
    password: "SecurePass123",
    studentId: "20260099",
    faculty: "Quality Assurance",
    phone: "081234567890",
  };
}

test.before(async () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "";
  initialStoreContent = await fs.readFile(dataFile, "utf8").catch(() => null);
});

test.after(async () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = originalSupabaseUrl;
  process.env.SUPABASE_SERVICE_ROLE_KEY = originalSupabaseKey;
  await restoreStore();
});

test("registerUser stores hardened password hashes", { concurrency: false }, async () => {
  await restoreStore();
  const payload = createUserPayload("register");
  const result = await registerUser(payload);
  const store = await readStoreFile();
  const savedUser = store.users.find((user) => user.email === payload.email);

  assert.ok(result.user.id);
  assert.ok(result.verificationToken);
  assert.ok(savedUser);
  assert.match(savedUser.passwordHash, /^scrypt\$/);
});

test("failed logins trigger account lockout", { concurrency: false }, async () => {
  await restoreStore();
  const payload = createUserPayload("lockout");
  await registerUser(payload);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    await assert.rejects(() => authenticateUser(payload.email, "WrongPassword999"));
  }

  const store = await readStoreFile();
  const savedUser = store.users.find((user) => user.email === payload.email);

  assert.ok(savedUser.lockedUntil);
  await assert.rejects(() => authenticateUser(payload.email, payload.password));
});

test("existing legacy accounts can still log in and are upgraded to scrypt", { concurrency: false }, async () => {
  await restoreStore();
  const payload = createUserPayload("legacy");
  const store = await readStoreFile();

  store.users.push({
    id: `legacy-${Date.now()}`,
    name: payload.name,
    email: payload.email,
    passwordHash: hashLegacyPassword(payload.password),
    studentId: payload.studentId,
    faculty: payload.faculty,
    phone: payload.phone,
    joinedAt: new Date().toISOString(),
    role: "customer",
    emailVerifiedAt: null,
    verificationTokenHash: null,
    verificationTokenExpiresAt: null,
    resetTokenHash: null,
    resetTokenExpiresAt: null,
    failedLoginCount: 0,
    lockedUntil: null,
    lastLoginAt: null,
    wishlist: [],
    notifications: [],
  });

  await fs.writeFile(dataFile, JSON.stringify(store, null, 2), "utf8");

  const user = await authenticateUser(payload.email, payload.password);
  const updatedStore = await readStoreFile();
  const savedUser = updatedStore.users.find((entry) => entry.email === payload.email);

  assert.equal(user.email, payload.email);
  assert.ok(savedUser);
  assert.match(savedUser.passwordHash, /^scrypt\$/);
  assert.ok(savedUser.lastLoginAt);
});

test("password reset flow updates credentials and wishlist persists server-side", { concurrency: false }, async () => {
  await restoreStore();
  const payload = createUserPayload("reset");
  const result = await registerUser(payload);
  const reset = await requestPasswordReset(payload.email);

  assert.ok(reset.resetToken);

  await resetPasswordWithToken(reset.resetToken, "EvenStronger456");
  const authenticatedUser = await authenticateUser(payload.email, "EvenStronger456");
  const wishlistResult = await toggleWishlistItem(result.user.id, "prd_001");
  const wishlist = await getWishlistByUserId(result.user.id);

  assert.equal(authenticatedUser.email, payload.email);
  assert.equal(wishlistResult.saved, true);
  assert.equal(wishlist.length, 1);
  assert.equal(wishlist[0].id, "prd_001");
});
