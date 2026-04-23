import { getDataSourceLabel, readStore, updateStore, writeStore } from "./db.js";
import {
  createMidtransTransaction,
  getMidtransTransactionStatus,
  isMidtransConfigured,
  mapMidtransTransactionToPaymentUpdate,
} from "./midtrans.js";
import {
  createSecretToken,
  createToken,
  hashOpaqueToken,
  hashPassword,
  validatePasswordStrength,
  verifyPassword,
} from "./security.js";

const MAX_NOTIFICATIONS = 24;
const MAX_WISHLIST_ITEMS = 48;
const LOGIN_ATTEMPT_LIMIT = 5;
const LOGIN_LOCK_WINDOW_MS = 15 * 60 * 1000;
const RESET_TOKEN_WINDOW_MS = 30 * 60 * 1000;
const VERIFY_TOKEN_WINDOW_MS = 24 * 60 * 60 * 1000;
const LOYALTY_TIERS = [
  { key: "bronze", label: "Bronze", threshold: 0 },
  { key: "silver", label: "Silver", threshold: 500 },
  { key: "gold", label: "Gold", threshold: 1500 },
  { key: "platinum", label: "Platinum", threshold: 3000 },
];

function createError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function nowIso() {
  return new Date().toISOString();
}

function futureIso(offsetMs) {
  return new Date(Date.now() + offsetMs).toISOString();
}

function isFutureTimestamp(value) {
  return Boolean(value) && new Date(value).getTime() > Date.now();
}

function getConfiguredAdminEmails() {
  return new Set(
    (process.env.SUPABASE_ADMIN_EMAILS || process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  );
}

function normalizeRole(role) {
  return role === "admin" ? "admin" : "customer";
}

function normalizeWishlistEntries(entries) {
  if (!Array.isArray(entries)) {
    return [];
  }

  return entries
    .map((entry) => {
      if (!entry?.productId) {
        return null;
      }

      return {
        productId: entry.productId,
        addedAt: entry.addedAt || nowIso(),
      };
    })
    .filter(Boolean)
    .slice(0, MAX_WISHLIST_ITEMS);
}

function normalizeNotifications(entries) {
  if (!Array.isArray(entries)) {
    return [];
  }

  return entries
    .map((entry) => {
      if (!entry?.id || !entry?.title || !entry?.message) {
        return null;
      }

      return {
        id: entry.id,
        type: entry.type || "system",
        title: entry.title,
        message: entry.message,
        href: typeof entry.href === "string" && entry.href.startsWith("/") ? entry.href : "/dashboard",
        createdAt: entry.createdAt || nowIso(),
        readAt: entry.readAt || null,
      };
    })
    .filter(Boolean)
    .slice(0, MAX_NOTIFICATIONS);
}

function normalizeStoredUser(user = {}) {
  return {
    ...user,
    role: normalizeRole(user.role),
    emailVerifiedAt: user.emailVerifiedAt ?? null,
    verificationTokenHash: user.verificationTokenHash ?? null,
    verificationTokenExpiresAt: user.verificationTokenExpiresAt ?? null,
    resetTokenHash: user.resetTokenHash ?? null,
    resetTokenExpiresAt: user.resetTokenExpiresAt ?? null,
    failedLoginCount: Number.isFinite(user.failedLoginCount) ? user.failedLoginCount : 0,
    lockedUntil: user.lockedUntil ?? null,
    lastLoginAt: user.lastLoginAt ?? null,
    wishlist: normalizeWishlistEntries(user.wishlist),
    notifications: normalizeNotifications(user.notifications),
  };
}

function normalizeStoreUsers(store) {
  store.users = (store.users || []).map((user) => normalizeStoredUser(user));
  return store;
}

function getUserById(store, userId) {
  normalizeStoreUsers(store);
  return store.users.find((entry) => entry.id === userId) ?? null;
}

function resolveUserRole({ email, explicitRole, users = [] }) {
  const normalizedEmail = email?.trim().toLowerCase();
  const configuredAdmins = getConfiguredAdminEmails();

  if (normalizeRole(explicitRole) === "admin") {
    return "admin";
  }

  if (normalizedEmail && configuredAdmins.has(normalizedEmail)) {
    return "admin";
  }

  const hasExistingAdmin = users.some((user) => {
    const role = normalizeRole(user.role);
    const isConfiguredAdmin = configuredAdmins.has(user.email?.trim().toLowerCase());
    return role === "admin" || isConfiguredAdmin;
  });

  if (!hasExistingAdmin && users.length === 0) {
    return "admin";
  }

  return "customer";
}

function sanitizeUser(user, users = []) {
  if (!user) {
    return null;
  }

  const normalizedUser = normalizeStoredUser(user);
  const {
    passwordHash,
    verificationTokenHash,
    verificationTokenExpiresAt,
    resetTokenHash,
    resetTokenExpiresAt,
    failedLoginCount,
    lockedUntil,
    ...rest
  } = normalizedUser;

  return {
    ...rest,
    role: resolveUserRole({
      email: rest.email,
      explicitRole: rest.role,
      users,
    }),
    wishlist: normalizeWishlistEntries(rest.wishlist),
    notifications: normalizeNotifications(rest.notifications),
  };
}

function createNotification({ type = "system", title, message, href = "/dashboard" }) {
  return {
    id: createToken(),
    type,
    title,
    message,
    href,
    createdAt: nowIso(),
    readAt: null,
  };
}

function addNotificationToUser(user, notification) {
  const nextNotifications = [notification, ...normalizeNotifications(user.notifications)];
  user.notifications = nextNotifications.slice(0, MAX_NOTIFICATIONS);
}

function markAllNotificationsAsRead(user) {
  const timestamp = nowIso();
  user.notifications = normalizeNotifications(user.notifications).map((entry) => ({
    ...entry,
    readAt: entry.readAt || timestamp,
  }));
}

function buildWishlistItems(store, user) {
  const normalizedUser = normalizeStoredUser(user);

  return normalizedUser.wishlist
    .map((entry) => {
      const product = store.products.find((candidate) => candidate.id === entry.productId);

      if (!product) {
        return null;
      }

      return {
        ...product,
        addedAt: entry.addedAt,
      };
    })
    .filter(Boolean)
    .sort((left, right) => new Date(right.addedAt).getTime() - new Date(left.addedAt).getTime());
}

function getFavoriteCategory(orders, fallbackCategory = "food") {
  const categoryTotals = new Map();

  for (const order of orders) {
    for (const item of order.items || []) {
      const currentTotal = categoryTotals.get(item.category) ?? 0;
      categoryTotals.set(item.category, currentTotal + (item.quantity || 0));
    }
  }

  let favoriteCategory = fallbackCategory;
  let highestCount = 0;

  for (const [category, count] of categoryTotals.entries()) {
    if (count > highestCount) {
      favoriteCategory = category;
      highestCount = count;
    }
  }

  return favoriteCategory;
}

function buildLoyaltyProfile(orders) {
  const paidOrders = orders.filter((order) => order.paymentStatus === "paid");
  const totalSpent = paidOrders.reduce((sum, order) => sum + (order.total ?? 0), 0);
  const points = Math.floor(totalSpent / 100);
  const tier =
    [...LOYALTY_TIERS].reverse().find((candidate) => points >= candidate.threshold) || LOYALTY_TIERS[0];
  const nextTier = LOYALTY_TIERS.find((candidate) => candidate.threshold > points) ?? null;
  const tierFloor = tier.threshold;
  const tierCeiling = nextTier?.threshold ?? tier.threshold + 1000;
  const range = Math.max(tierCeiling - tierFloor, 1);
  const progress = Math.min(100, Math.max(8, Math.round(((points - tierFloor) / range) * 100)));

  return {
    points,
    tierKey: tier.key,
    tierLabel: tier.label,
    nextTierLabel: nextTier?.label ?? null,
    nextTierThreshold: nextTier?.threshold ?? null,
    pointsToNextTier: nextTier ? Math.max(nextTier.threshold - points, 0) : 0,
    progress,
  };
}

function summarizeSalesTrend(orders, days = 7) {
  const buckets = [];
  const today = new Date();

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const current = new Date(today);
    current.setHours(0, 0, 0, 0);
    current.setDate(today.getDate() - offset);
    const key = current.toISOString().slice(0, 10);
    buckets.push({
      key,
      label: current.toLocaleDateString("id-ID", { day: "2-digit", month: "short" }),
      revenue: 0,
      orders: 0,
    });
  }

  const bucketMap = new Map(buckets.map((entry) => [entry.key, entry]));

  for (const order of orders) {
    const key = String(order.createdAt || "").slice(0, 10);
    const bucket = bucketMap.get(key);

    if (!bucket) {
      continue;
    }

    bucket.orders += 1;
    bucket.revenue += order.total ?? 0;
  }

  return buckets;
}

function summarizeTopProducts(orders, products) {
  const productMap = new Map(products.map((product) => [product.id, product]));
  const summaries = new Map();

  for (const order of orders) {
    for (const item of order.items || []) {
      const current = summaries.get(item.productId) ?? {
        productId: item.productId,
        name: item.name,
        category: item.category,
        quantity: 0,
        revenue: 0,
      };

      current.quantity += item.quantity ?? 0;
      current.revenue += item.lineTotal ?? 0;
      summaries.set(item.productId, current);
    }
  }

  return [...summaries.values()]
    .map((entry) => ({
      ...entry,
      inventory: productMap.get(entry.productId)?.inventory ?? 0,
    }))
    .sort((left, right) => right.revenue - left.revenue || right.quantity - left.quantity)
    .slice(0, 5);
}

function summarizeCategoryPerformance(orders) {
  const categories = new Map();

  for (const order of orders) {
    for (const item of order.items || []) {
      const current = categories.get(item.category) ?? {
        category: item.category,
        revenue: 0,
        quantity: 0,
      };

      current.revenue += item.lineTotal ?? 0;
      current.quantity += item.quantity ?? 0;
      categories.set(item.category, current);
    }
  }

  return [...categories.values()].sort((left, right) => right.revenue - left.revenue).slice(0, 4);
}

function summarizeKeyValue(collection, keyFn, valueFn = () => 1) {
  const summary = new Map();

  for (const item of collection) {
    const key = keyFn(item);
    const current = summary.get(key) ?? 0;
    summary.set(key, current + valueFn(item));
  }

  return [...summary.entries()].map(([label, value]) => ({ label, value }));
}

function describePaymentStatus(paymentStatus) {
  switch (paymentStatus) {
    case "paid":
      return "Pembayaran sudah berhasil dan pesanan sedang diproses.";
    case "pending":
      return "Menunggu Anda menyelesaikan pembayaran.";
    case "expired":
      return "Sesi pembayaran berakhir sebelum transaksi selesai.";
    case "failed":
      return "Pembayaran gagal dan perlu dicoba kembali.";
    default:
      return "Status pembayaran sedang diperbarui.";
  }
}

export function isUserAdmin(user) {
  return normalizeRole(user?.role) === "admin";
}

function buildCartSummary(store, userId, options = {}) {
  const cart = store.carts.find((entry) => entry.userId === userId) ?? { userId, items: [] };
  const items = cart.items
    .map((item) => {
      const product = store.products.find((entry) => entry.id === item.productId);

      if (!product) {
        return null;
      }

      return {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        image: product.image,
        price: product.price,
        quantity: item.quantity,
        lineTotal: product.price * item.quantity,
        category: product.category,
      };
    })
    .filter(Boolean);

  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const serviceFee = items.length > 0 ? 2500 : 0;
  const deliveryFee =
    options.fulfillmentMethod === "pickup" || subtotal === 0 || subtotal >= 150000 ? 0 : 12000;
  const total = subtotal + serviceFee + deliveryFee;
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    items,
    subtotal,
    serviceFee,
    deliveryFee,
    total,
    totalItems,
  };
}

function validateCheckoutPayload(payload) {
  if (!payload.fullName || !payload.phone || !payload.address) {
    throw createError("Data checkout belum lengkap.");
  }
}

function getDefaultPaymentDetails(paymentMethod = "M-Pay") {
  return {
    status: "Paid & Confirmed",
    paymentStatus: "paid",
    paymentReference: `PAY-${Date.now().toString().slice(-8)}`,
    paymentProvider: "manual-supabase-ready",
    paymentMethod,
    paidAt: nowIso(),
  };
}

function clearPurchasedItemsFromCart(cart, orderItems) {
  const quantities = new Map(orderItems.map((item) => [item.productId, item.quantity]));

  cart.items = cart.items
    .map((item) => {
      const purchased = quantities.get(item.productId) ?? 0;
      const remaining = item.quantity - purchased;

      if (remaining <= 0) {
        return null;
      }

      return {
        ...item,
        quantity: remaining,
      };
    })
    .filter(Boolean);
}

function applyPaymentUpdateToOrder(store, order, paymentUpdate) {
  const previousStatus = order.status;
  const previousPaymentStatus = order.paymentStatus;

  order.status = paymentUpdate.status;
  order.paymentStatus = paymentUpdate.paymentStatus;
  order.paymentReference = paymentUpdate.paymentReference ?? order.paymentReference ?? null;
  order.paymentProvider = paymentUpdate.paymentProvider ?? order.paymentProvider ?? null;
  order.paymentMethod = paymentUpdate.paymentMethod ?? order.paymentMethod;
  order.paymentPayload = paymentUpdate.paymentPayload ?? order.paymentPayload ?? null;
  order.paidAt = paymentUpdate.paidAt ?? order.paidAt ?? null;

  if (!paymentUpdate.shouldApplyStock || order.stockApplied) {
    return {
      order,
      changed:
        previousStatus !== order.status || previousPaymentStatus !== order.paymentStatus,
      previousStatus,
      previousPaymentStatus,
    };
  }

  for (const item of order.items) {
    const product = store.products.find((entry) => entry.id === item.productId);

    if (!product || product.inventory < item.quantity) {
      order.status = "Paid - Manual Review";
      return {
        order,
        changed:
          previousStatus !== order.status || previousPaymentStatus !== order.paymentStatus,
        previousStatus,
        previousPaymentStatus,
      };
    }
  }

  for (const item of order.items) {
    const product = store.products.find((entry) => entry.id === item.productId);
    product.inventory -= item.quantity;
  }

  const cart = store.carts.find((entry) => entry.userId === order.userId);

  if (cart) {
    clearPurchasedItemsFromCart(cart, order.items);
  }

  order.stockApplied = true;

  return {
    order,
    changed: previousStatus !== order.status || previousPaymentStatus !== order.paymentStatus,
    previousStatus,
    previousPaymentStatus,
  };
}

export async function getCatalog({ search = "", category = "all", sort = "featured" } = {}) {
  const store = await readStore();
  const normalizedSearch = search.trim().toLowerCase();

  const products = store.products
    .filter((product) => category === "all" || product.category === category)
    .filter((product) => {
      if (!normalizedSearch) {
        return true;
      }

      const haystack = [
        product.name,
        product.tagline,
        product.description,
        product.category,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });

  products.sort((left, right) => {
    switch (sort) {
      case "price-low":
        return left.price - right.price || right.rating - left.rating;
      case "price-high":
        return right.price - left.price || right.rating - left.rating;
      case "rating":
        return right.rating - left.rating || right.reviews - left.reviews;
      case "name":
        return left.name.localeCompare(right.name);
      case "featured":
      default:
        return Number(right.featured) - Number(left.featured) || right.rating - left.rating;
    }
  });

  return {
    categories: store.categories,
    products,
  };
}

export async function getHomePageData() {
  const store = await readStore();

  return {
    categories: store.categories,
    featuredProducts: store.products.filter((product) => product.featured).slice(0, 4),
    featuredStats: [
      { label: "Active Products", value: `${store.products.length}+` },
      { label: "Campus Departments", value: "12" },
      { label: "Average Rating", value: "4.8/5" },
      { label: "Fast Fulfillment", value: "< 45 min" },
    ],
  };
}

export async function getProductBySlug(slug) {
  const store = await readStore();
  return store.products.find((product) => product.slug === slug) ?? null;
}

export async function getProductById(productId) {
  const store = await readStore();
  return store.products.find((product) => product.id === productId) ?? null;
}

export async function getRelatedProducts(slug) {
  const store = await readStore();
  const active = store.products.find((product) => product.slug === slug);

  if (!active) {
    return [];
  }

  return store.products
    .filter((product) => product.slug !== slug)
    .filter((product) => product.category === active.category)
    .slice(0, 3);
}

function createVerificationTokenForUser(user) {
  const token = createSecretToken(20);
  user.verificationTokenHash = hashOpaqueToken(token);
  user.verificationTokenExpiresAt = futureIso(VERIFY_TOKEN_WINDOW_MS);
  return token;
}

function createResetTokenForUser(user) {
  const token = createSecretToken(20);
  user.resetTokenHash = hashOpaqueToken(token);
  user.resetTokenExpiresAt = futureIso(RESET_TOKEN_WINDOW_MS);
  return token;
}

function getLockoutMessage(lockedUntil) {
  const minutes = Math.max(1, Math.ceil((new Date(lockedUntil).getTime() - Date.now()) / (60 * 1000)));
  return `Terlalu banyak percobaan login. Coba lagi dalam ${minutes} menit.`;
}

export async function registerUser({ name, email, password, studentId, faculty, phone }) {
  if (!name || !email || !password) {
    throw createError("Nama, email, dan password wajib diisi.");
  }

  const passwordError = validatePasswordStrength(password);

  if (passwordError) {
    throw createError(passwordError);
  }

  return updateStore((store) => {
    normalizeStoreUsers(store);
    const normalizedEmail = email.trim().toLowerCase();

    if (store.users.some((user) => user.email === normalizedEmail)) {
      throw createError("Email sudah terdaftar.");
    }

    const user = {
      id: createToken(),
      name: name.trim(),
      email: normalizedEmail,
      passwordHash: hashPassword(password),
      studentId: studentId?.trim() || "Belum diisi",
      faculty: faculty?.trim() || "Mahasiswa Masoem University",
      phone: phone?.trim() || "-",
      joinedAt: nowIso(),
      role: resolveUserRole({
        email: normalizedEmail,
        users: store.users,
      }),
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
    };

    const verificationToken = createVerificationTokenForUser(user);
    addNotificationToUser(
      user,
      createNotification({
        type: "system",
        title: "Akun berhasil dibuat",
        message: "Selamat datang di Masoem Market. Verifikasi email tersedia agar akun lebih aman.",
        href: "/profile",
      }),
    );
    store.users.push(user);

    return {
      store,
      result: {
        user: sanitizeUser(user, store.users),
        verificationToken,
      },
    };
  });
}

export async function authenticateUser(email, password) {
  const store = await readStore();
  normalizeStoreUsers(store);
  const normalizedEmail = email.trim().toLowerCase();
  const user = store.users.find((entry) => entry.email === normalizedEmail);

  if (!user) {
    throw createError("Email atau password tidak valid.", 401);
  }

  if (isFutureTimestamp(user.lockedUntil)) {
    throw createError(getLockoutMessage(user.lockedUntil), 429);
  }

  const passwordCheck = verifyPassword(password, user.passwordHash);

  if (!passwordCheck.valid) {
    user.failedLoginCount = (user.failedLoginCount ?? 0) + 1;

    if (user.failedLoginCount >= LOGIN_ATTEMPT_LIMIT) {
      user.failedLoginCount = 0;
      user.lockedUntil = futureIso(LOGIN_LOCK_WINDOW_MS);
    }

    await writeStore(store);
    throw createError("Email atau password tidak valid.", 401);
  }

  if (passwordCheck.needsUpgrade) {
    user.passwordHash = hashPassword(password);
  }

  user.failedLoginCount = 0;
  user.lockedUntil = null;
  user.lastLoginAt = nowIso();

  await writeStore(store);
  return sanitizeUser(user, store.users);
}

export async function createSessionForUser(userId) {
  return updateStore((store) => {
    normalizeStoreUsers(store);
    const user = getUserById(store, userId);
    const token = createToken();
    store.sessions = store.sessions.filter((session) => session.userId !== userId);
    store.sessions.push({
      token,
      userId,
      createdAt: nowIso(),
    });

    if (user) {
      user.lastLoginAt = nowIso();
    }

    return {
      store,
      result: token,
    };
  });
}

export async function destroySession(token) {
  await updateStore((store) => {
    store.sessions = store.sessions.filter((session) => session.token !== token);
    return store;
  });
}

export async function requestPasswordReset(email) {
  return updateStore((store) => {
    normalizeStoreUsers(store);
    const normalizedEmail = email.trim().toLowerCase();
    const user = store.users.find((entry) => entry.email === normalizedEmail);
    let resetToken = null;

    if (user) {
      resetToken = createResetTokenForUser(user);
      addNotificationToUser(
        user,
        createNotification({
          type: "system",
          title: "Permintaan reset password",
          message: "Tautan reset password baru telah dibuat untuk akun Anda.",
          href: "/profile",
        }),
      );
    }

    return {
      store,
      result: {
        requested: true,
        resetToken,
      },
    };
  });
}

export async function resetPasswordWithToken(token, password) {
  const passwordError = validatePasswordStrength(password);

  if (passwordError) {
    throw createError(passwordError);
  }

  return updateStore((store) => {
    normalizeStoreUsers(store);
    const tokenHash = hashOpaqueToken(token);
    const user = store.users.find(
      (entry) =>
        entry.resetTokenHash === tokenHash &&
        entry.resetTokenExpiresAt &&
        new Date(entry.resetTokenExpiresAt).getTime() >= Date.now(),
    );

    if (!user) {
      throw createError("Tautan reset password tidak valid atau sudah kedaluwarsa.", 400);
    }

    user.passwordHash = hashPassword(password);
    user.resetTokenHash = null;
    user.resetTokenExpiresAt = null;
    user.failedLoginCount = 0;
    user.lockedUntil = null;
    addNotificationToUser(
      user,
      createNotification({
        type: "system",
        title: "Password berhasil diperbarui",
        message: "Kata sandi Anda sudah diubah. Gunakan password baru saat login berikutnya.",
        href: "/login",
      }),
    );

    return {
      store,
      result: sanitizeUser(user, store.users),
    };
  });
}

export async function requestEmailVerification(userId) {
  return updateStore((store) => {
    normalizeStoreUsers(store);
    const user = getUserById(store, userId);

    if (!user) {
      throw createError("Akun tidak ditemukan.", 404);
    }

    if (user.emailVerifiedAt) {
      return {
        store,
        result: {
          alreadyVerified: true,
          verificationToken: null,
        },
      };
    }

    const verificationToken = createVerificationTokenForUser(user);

    return {
      store,
      result: {
        alreadyVerified: false,
        verificationToken,
      },
    };
  });
}

export async function verifyEmailWithToken(token) {
  return updateStore((store) => {
    normalizeStoreUsers(store);
    const tokenHash = hashOpaqueToken(token);
    const user = store.users.find(
      (entry) =>
        entry.verificationTokenHash === tokenHash &&
        entry.verificationTokenExpiresAt &&
        new Date(entry.verificationTokenExpiresAt).getTime() >= Date.now(),
    );

    if (!user) {
      throw createError("Tautan verifikasi tidak valid atau sudah kedaluwarsa.", 400);
    }

    user.emailVerifiedAt = nowIso();
    user.verificationTokenHash = null;
    user.verificationTokenExpiresAt = null;
    addNotificationToUser(
      user,
      createNotification({
        type: "system",
        title: "Email berhasil diverifikasi",
        message: "Akun Anda sekarang sudah terverifikasi dan siap dipakai dengan aman.",
        href: "/profile",
      }),
    );

    return {
      store,
      result: sanitizeUser(user, store.users),
    };
  });
}

export async function getUserBySessionToken(token) {
  if (!token) {
    return null;
  }

  const store = await readStore();
  normalizeStoreUsers(store);
  const session = store.sessions.find((entry) => entry.token === token);

  if (!session) {
    return null;
  }

  return sanitizeUser(
    store.users.find((user) => user.id === session.userId),
    store.users,
  );
}

export async function getWishlistByUserId(userId) {
  const store = await readStore();
  const user = getUserById(store, userId);

  if (!user) {
    return [];
  }

  return buildWishlistItems(store, user);
}

export async function toggleWishlistItem(userId, productId) {
  return updateStore((store) => {
    normalizeStoreUsers(store);
    const user = getUserById(store, userId);

    if (!user) {
      throw createError("Akun tidak ditemukan.", 404);
    }

    const product = store.products.find((entry) => entry.id === productId);

    if (!product) {
      throw createError("Produk tidak ditemukan.", 404);
    }

    const existingIndex = user.wishlist.findIndex((entry) => entry.productId === productId);
    let saved = false;

    if (existingIndex >= 0) {
      user.wishlist.splice(existingIndex, 1);
    } else {
      user.wishlist.unshift({
        productId,
        addedAt: nowIso(),
      });
      user.wishlist = user.wishlist.slice(0, MAX_WISHLIST_ITEMS);
      saved = true;
    }

    return {
      store,
      result: {
        saved,
        items: buildWishlistItems(store, user),
      },
    };
  });
}

export async function mergeWishlistItems(userId, productIds = []) {
  return updateStore((store) => {
    normalizeStoreUsers(store);
    const user = getUserById(store, userId);

    if (!user) {
      throw createError("Akun tidak ditemukan.", 404);
    }

    const existingIds = new Set(user.wishlist.map((entry) => entry.productId));

    for (const productId of productIds) {
      if (!productId || existingIds.has(productId)) {
        continue;
      }

      const product = store.products.find((entry) => entry.id === productId);

      if (!product) {
        continue;
      }

      user.wishlist.unshift({
        productId,
        addedAt: nowIso(),
      });
      existingIds.add(productId);
    }

    user.wishlist = user.wishlist.slice(0, MAX_WISHLIST_ITEMS);

    return {
      store,
      result: buildWishlistItems(store, user),
    };
  });
}

export async function getNotificationsByUserId(userId) {
  const store = await readStore();
  const user = getUserById(store, userId);

  if (!user) {
    return [];
  }

  return normalizeNotifications(user.notifications);
}

export async function markNotificationsAsRead(userId) {
  return updateStore((store) => {
    normalizeStoreUsers(store);
    const user = getUserById(store, userId);

    if (!user) {
      throw createError("Akun tidak ditemukan.", 404);
    }

    markAllNotificationsAsRead(user);

    return {
      store,
      result: normalizeNotifications(user.notifications),
    };
  });
}

export async function getCartByUserId(userId, options = {}) {
  const store = await readStore();
  return buildCartSummary(store, userId, options);
}

export async function getCartCountByUserId(userId) {
  const cart = await getCartByUserId(userId);
  return cart.totalItems;
}

export async function addItemToCart(userId, productId, quantity = 1) {
  if (!productId) {
    throw createError("Produk tidak ditemukan.");
  }

  return updateStore((store) => {
    const product = store.products.find((entry) => entry.id === productId);

    if (!product) {
      throw createError("Produk tidak tersedia.");
    }

    if (product.inventory < quantity) {
      throw createError("Stok produk tidak mencukupi.");
    }

    let cart = store.carts.find((entry) => entry.userId === userId);
    if (!cart) {
      cart = { userId, items: [] };
      store.carts.push(cart);
    }

    const existing = cart.items.find((entry) => entry.productId === productId);

    if (existing) {
      const nextQuantity = existing.quantity + quantity;
      if (nextQuantity > product.inventory) {
        throw createError("Jumlah melebihi stok tersedia.");
      }
      existing.quantity = nextQuantity;
    } else {
      cart.items.push({ productId, quantity });
    }

    return {
      store,
      result: buildCartSummary(store, userId),
    };
  });
}

export async function updateCartItem(userId, productId, quantity) {
  return updateStore((store) => {
    const cart = store.carts.find((entry) => entry.userId === userId);
    const product = store.products.find((entry) => entry.id === productId);

    if (!cart || !product) {
      throw createError("Item keranjang tidak ditemukan.", 404);
    }

    const item = cart.items.find((entry) => entry.productId === productId);

    if (!item) {
      throw createError("Item keranjang tidak ditemukan.", 404);
    }

    if (quantity <= 0) {
      cart.items = cart.items.filter((entry) => entry.productId !== productId);
    } else {
      if (quantity > product.inventory) {
        throw createError("Jumlah melebihi stok tersedia.");
      }
      item.quantity = quantity;
    }

    return {
      store,
      result: buildCartSummary(store, userId),
    };
  });
}

export async function removeCartItem(userId, productId) {
  return updateCartItem(userId, productId, 0);
}

export async function placeOrder(userId, payload) {
  validateCheckoutPayload(payload);
  const paymentDetails = getDefaultPaymentDetails(payload.paymentMethod || "M-Pay");

  return updateStore((store) => {
    normalizeStoreUsers(store);
    const user = getUserById(store, userId);
    const cart = store.carts.find((entry) => entry.userId === userId) ?? { userId, items: [] };
    const summary = buildCartSummary(store, userId, {
      fulfillmentMethod: payload.fulfillmentMethod,
    });

    if (summary.items.length === 0) {
      throw createError("Keranjang masih kosong.");
    }

    for (const item of cart.items) {
      const product = store.products.find((entry) => entry.id === item.productId);
      if (!product || product.inventory < item.quantity) {
        throw createError(`Stok untuk ${product?.name ?? "produk"} tidak mencukupi.`);
      }
    }

    const order = {
      id: createToken(),
      orderNumber: `MU-${Date.now().toString().slice(-6)}`,
      userId,
      status: paymentDetails.status,
      paymentStatus: paymentDetails.paymentStatus,
      paymentReference: paymentDetails.paymentReference,
      paymentProvider: paymentDetails.paymentProvider,
      createdAt: new Date().toISOString(),
      estimatedReadyAt: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
      fulfillmentMethod: payload.fulfillmentMethod || "delivery",
      paymentMethod: paymentDetails.paymentMethod,
      paidAt: paymentDetails.paidAt,
      paymentToken: null,
      paymentUrl: null,
      paymentPayload: null,
      stockApplied: false,
      notes: payload.notes?.trim() || "",
      shipping: {
        fullName: payload.fullName.trim(),
        phone: payload.phone.trim(),
        address: payload.address.trim(),
      },
      items: summary.items,
      subtotal: summary.subtotal,
      serviceFee: summary.serviceFee,
      deliveryFee: summary.deliveryFee,
      total: summary.total,
    };

    store.orders.unshift(order);
    applyPaymentUpdateToOrder(store, order, {
      ...paymentDetails,
      paymentPayload: null,
      shouldApplyStock: true,
    });
    if (user) {
      addNotificationToUser(
        user,
        createNotification({
          type: "order",
          title: "Pesanan berhasil dibuat",
          message: `Pesanan ${order.orderNumber} sudah dikonfirmasi dengan pembayaran ${order.paymentMethod}.`,
          href: `/dashboard?order=${encodeURIComponent(order.orderNumber)}`,
        }),
      );
    }

    return {
      store,
      result: order,
    };
  });
}

export async function createPendingOrder(userId, payload) {
  validateCheckoutPayload(payload);

  return updateStore((store) => {
    normalizeStoreUsers(store);
    const user = getUserById(store, userId);
    const cart = store.carts.find((entry) => entry.userId === userId) ?? { userId, items: [] };
    const summary = buildCartSummary(store, userId, {
      fulfillmentMethod: payload.fulfillmentMethod,
    });

    if (summary.items.length === 0) {
      throw createError("Keranjang masih kosong.");
    }

    for (const item of cart.items) {
      const product = store.products.find((entry) => entry.id === item.productId);
      if (!product || product.inventory < item.quantity) {
        throw createError(`Stok untuk ${product?.name ?? "produk"} tidak mencukupi.`);
      }
    }

    const order = {
      id: createToken(),
      orderNumber: `MU-${Date.now().toString().slice(-6)}`,
      userId,
      status: "Awaiting Payment",
      paymentStatus: "pending",
      paymentReference: null,
      paymentProvider: "midtrans",
      createdAt: new Date().toISOString(),
      estimatedReadyAt: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
      fulfillmentMethod: payload.fulfillmentMethod || "delivery",
      paymentMethod: payload.paymentMethod || "Midtrans",
      paidAt: null,
      paymentToken: null,
      paymentUrl: null,
      paymentPayload: null,
      stockApplied: false,
      notes: payload.notes?.trim() || "",
      shipping: {
        fullName: payload.fullName.trim(),
        phone: payload.phone.trim(),
        address: payload.address.trim(),
      },
      items: summary.items,
      subtotal: summary.subtotal,
      serviceFee: summary.serviceFee,
      deliveryFee: summary.deliveryFee,
      total: summary.total,
    };

    store.orders.unshift(order);
    if (user) {
      addNotificationToUser(
        user,
        createNotification({
          type: "order",
          title: "Menunggu pembayaran",
          message: `Pesanan ${order.orderNumber} sudah dibuat. Selesaikan pembayaran untuk memulai proses pesanan.`,
          href: `/dashboard?order=${encodeURIComponent(order.orderNumber)}`,
        }),
      );
    }

    return {
      store,
      result: order,
    };
  });
}

export async function attachPaymentSessionToOrder(orderNumber, paymentSession) {
  return updateStore((store) => {
    const order = store.orders.find((entry) => entry.orderNumber === orderNumber);

    if (!order) {
      throw createError("Pesanan tidak ditemukan.", 404);
    }

    order.paymentToken = paymentSession.token ?? null;
    order.paymentUrl = paymentSession.redirectUrl ?? null;

    return {
      store,
      result: order,
    };
  });
}

export async function getOrdersByUserId(userId) {
  const store = await readStore();
  return store.orders
    .filter((order) => order.userId === userId)
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
}

export async function getOrderByOrderNumber(orderNumber) {
  if (!orderNumber) {
    return null;
  }

  const store = await readStore();
  return store.orders.find((order) => order.orderNumber === orderNumber) ?? null;
}

export async function createCheckoutSession(user, payload, options = {}) {
  if (!isMidtransConfigured()) {
    const order = await placeOrder(user.id, payload);
    return {
      order,
      payment: null,
    };
  }

  const cart = await getCartByUserId(user.id, {
    fulfillmentMethod: payload.fulfillmentMethod,
  });
  const order = await createPendingOrder(user.id, payload);
  const paymentSession = await createMidtransTransaction({
    order,
    customer: user,
    cart,
    baseUrl: options.baseUrl,
  });
  const updatedOrder = await attachPaymentSessionToOrder(order.orderNumber, paymentSession);

  return {
    order: updatedOrder,
    payment: paymentSession,
  };
}

export async function applyOrderPaymentUpdate(orderNumber, paymentUpdate) {
  return updateStore((store) => {
    normalizeStoreUsers(store);
    const order = store.orders.find((entry) => entry.orderNumber === orderNumber);

    if (!order) {
      throw createError("Pesanan tidak ditemukan.", 404);
    }

    const { changed } = applyPaymentUpdateToOrder(store, order, paymentUpdate);
    const user = getUserById(store, order.userId);

    if (changed && user) {
      addNotificationToUser(
        user,
        createNotification({
          type: "payment",
          title: `Update pembayaran ${order.orderNumber}`,
          message: describePaymentStatus(order.paymentStatus),
          href: `/dashboard?order=${encodeURIComponent(order.orderNumber)}`,
        }),
      );
    }

    return {
      store,
      result: order,
    };
  });
}

export async function syncOrderPaymentStatus(orderNumber) {
  const order = await getOrderByOrderNumber(orderNumber);

  if (!order || !isMidtransConfigured() || order.paymentProvider !== "midtrans") {
    return order;
  }

  try {
    const payload = await getMidtransTransactionStatus(orderNumber);
    return applyOrderPaymentUpdate(orderNumber, mapMidtransTransactionToPaymentUpdate(payload));
  } catch (error) {
    if (error.status === 404) {
      return order;
    }

    throw error;
  }
}

export async function getDashboardData(userId) {
  const store = await readStore();
  normalizeStoreUsers(store);
  const userRecord = getUserById(store, userId);
  const user = sanitizeUser(userRecord, store.users);
  const orders = store.orders.filter((order) => order.userId === userId);
  const cart = buildCartSummary(store, userId);
  const totalSpent = orders.reduce((sum, order) => sum + (order.total ?? 0), 0);
  const loyalty = buildLoyaltyProfile(orders);
  const wishlist = buildWishlistItems(store, userRecord);
  const favoriteCategory = getFavoriteCategory(orders, wishlist[0]?.category || store.categories[0]?.slug || "food");
  const recommendations = store.products
    .filter((product) => product.category === favoriteCategory || product.featured)
    .sort((left, right) => Number(right.featured) - Number(left.featured) || right.rating - left.rating)
    .slice(0, 3);

  return {
    user,
    cart,
    orders,
    loyalty,
    wishlist,
    recentActivity: normalizeNotifications(userRecord?.notifications).slice(0, 5),
    stats: [
      { label: "Total Orders", value: String(orders.length) },
      { label: "Active Cart Items", value: String(cart.totalItems) },
      { label: "Total Spending", value: totalSpent },
      { label: "Loyalty Points", value: String(loyalty.points) },
    ],
    recommendations,
  };
}

export async function getAdminDashboardData() {
  const store = await readStore();
  normalizeStoreUsers(store);
  const users = store.users
    .map((user) => sanitizeUser(user, store.users))
    .sort((left, right) => new Date(right.joinedAt).getTime() - new Date(left.joinedAt).getTime());
  const orders = [...store.orders].sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
  const revenue = orders.reduce((sum, order) => sum + order.total, 0);
  const pendingPayments = orders.filter((order) => order.paymentStatus !== "paid").length;
  const lowStockProducts = [...store.products]
    .sort((left, right) => left.inventory - right.inventory)
    .slice(0, 5);
  const inventoryProducts = [...store.products].sort((left, right) => {
    return left.category.localeCompare(right.category) || left.name.localeCompare(right.name);
  });
  const newestCustomers = users.slice(0, 5);
  const salesTrend = summarizeSalesTrend(orders);
  const paymentMethods = summarizeKeyValue(
    orders,
    (order) => order.paymentMethod || "Belum diatur",
    () => 1,
  ).sort((left, right) => right.value - left.value);
  const fulfillmentBreakdown = summarizeKeyValue(
    orders,
    (order) => order.fulfillmentMethod || "delivery",
    () => 1,
  ).sort((left, right) => right.value - left.value);
  const statusDistribution = summarizeKeyValue(
    orders,
    (order) => order.status || "Unknown",
    () => 1,
  ).sort((left, right) => right.value - left.value);
  const topProducts = summarizeTopProducts(orders, store.products);
  const categoryPerformance = summarizeCategoryPerformance(orders);

  return {
    dataSource: getDataSourceLabel(),
    stats: [
      { label: "Total Revenue", value: revenue },
      { label: "Orders Masuk", value: String(orders.length) },
      { label: "Akun Terdaftar", value: String(users.length) },
      { label: "Pending Payment", value: String(pendingPayments) },
    ],
    recentOrders: orders.slice(0, 8),
    recentCustomers: newestCustomers,
    lowStockProducts,
    inventoryProducts,
    salesTrend,
    paymentMethods,
    fulfillmentBreakdown,
    statusDistribution,
    topProducts,
    categoryPerformance,
    paymentOverview: [
      {
        label: "Pembayaran Lunas",
        value: String(orders.filter((order) => order.paymentStatus === "paid").length),
        description: "Jumlah order yang sudah tercatat lunas di sistem.",
      },
      {
        label: "Metode Favorit",
        value: paymentMethods[0]?.label ?? "Belum ada order",
        description: "Metode pembayaran yang paling sering dipakai pelanggan.",
      },
      {
        label: "Reference Terakhir",
        value: orders[0]?.paymentReference ?? "Belum tersedia",
        description: "Kode referensi transaksi yang bisa dipakai untuk rekonsiliasi manual.",
      },
    ],
  };
}

export async function updateAdminOrderStatus(orderNumber, nextStatus) {
  const allowedStatuses = new Set([
    "Awaiting Payment",
    "Payment Expired",
    "Payment Failed",
    "Paid & Confirmed",
    "Preparing",
    "Ready for Pickup",
    "Out for Delivery",
    "Completed",
    "Cancelled",
  ]);

  if (!allowedStatuses.has(nextStatus)) {
    throw createError("Status order tidak valid.", 400);
  }

  return updateStore((store) => {
    normalizeStoreUsers(store);
    const order = store.orders.find((entry) => entry.orderNumber === orderNumber);

    if (!order) {
      throw createError("Pesanan tidak ditemukan.", 404);
    }

    const previousStatus = order.status;
    order.status = nextStatus;
    const user = getUserById(store, order.userId);

    if (user && previousStatus !== nextStatus) {
      addNotificationToUser(
        user,
        createNotification({
          type: "order",
          title: `Status pesanan ${order.orderNumber} diperbarui`,
          message: `Pesanan Anda berpindah dari ${previousStatus} ke ${nextStatus}.`,
          href: `/dashboard?order=${encodeURIComponent(order.orderNumber)}`,
        }),
      );
    }

    return {
      store,
      result: order,
    };
  });
}

export async function updateAdminProductInventory(productId, nextInventory) {
  const inventory = Number(nextInventory);

  if (!Number.isInteger(inventory) || inventory < 0) {
    throw createError("Stok harus berupa angka bulat 0 atau lebih.", 400);
  }

  return updateStore((store) => {
    const product = store.products.find((entry) => entry.id === productId);

    if (!product) {
      throw createError("Produk tidak ditemukan.", 404);
    }

    product.inventory = inventory;

    return {
      store,
      result: product,
    };
  });
}

function generateSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

export async function addProduct({
  name,
  category,
  price,
  inventory,
  tagline,
  description,
  features,
  image,
  featured,
}) {
  if (!name || !name.trim()) {
    throw createError("Nama produk wajib diisi.");
  }

  if (!category || !category.trim()) {
    throw createError("Kategori wajib dipilih.");
  }

  const parsedPrice = Number(price);
  if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
    throw createError("Harga harus berupa angka lebih dari 0.");
  }

  const parsedInventory = Number(inventory);
  if (!Number.isInteger(parsedInventory) || parsedInventory < 0) {
    throw createError("Stok harus berupa angka bulat 0 atau lebih.");
  }

  if (!tagline || !tagline.trim()) {
    throw createError("Tagline produk wajib diisi.");
  }

  if (!description || !description.trim()) {
    throw createError("Deskripsi produk wajib diisi.");
  }

  if (!image || !image.trim()) {
    throw createError("URL gambar produk wajib diisi.");
  }

  const featureList = Array.isArray(features)
    ? features.filter((f) => f && f.trim())
    : typeof features === "string"
      ? features
          .split("\n")
          .map((f) => f.trim())
          .filter(Boolean)
      : [];

  return updateStore((store) => {
    const baseSlug = generateSlug(name);
    let slug = baseSlug;
    let counter = 1;

    while (store.products.some((p) => p.slug === slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const product = {
      id: `prd_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      slug,
      name: name.trim(),
      category: category.trim(),
      price: parsedPrice,
      rating: 0,
      reviews: 0,
      featured: Boolean(featured),
      inventory: parsedInventory,
      tagline: tagline.trim(),
      description: description.trim(),
      features: featureList,
      image: image.trim(),
    };

    store.products.push(product);

    return {
      store,
      result: product,
    };
  });
}

export async function deleteProduct(productId) {
  if (!productId) {
    throw createError("ID produk tidak boleh kosong.");
  }

  return updateStore((store) => {
    const index = store.products.findIndex((entry) => entry.id === productId);

    if (index === -1) {
      throw createError("Produk tidak ditemukan.", 404);
    }

    const [removed] = store.products.splice(index, 1);

    return {
      store,
      result: removed,
    };
  });
}
