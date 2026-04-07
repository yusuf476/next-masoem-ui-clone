import { getDataSourceLabel, readStore, updateStore } from "./db";
import {
  createMidtransTransaction,
  getMidtransTransactionStatus,
  isMidtransConfigured,
  mapMidtransTransactionToPaymentUpdate,
} from "./midtrans";
import { createToken, hashPassword } from "./security";

function createError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
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

  const { passwordHash, ...rest } = user;
  return {
    ...rest,
    role: resolveUserRole({
      email: rest.email,
      explicitRole: rest.role,
      users,
    }),
  };
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
    paidAt: new Date().toISOString(),
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
  order.status = paymentUpdate.status;
  order.paymentStatus = paymentUpdate.paymentStatus;
  order.paymentReference = paymentUpdate.paymentReference ?? order.paymentReference ?? null;
  order.paymentProvider = paymentUpdate.paymentProvider ?? order.paymentProvider ?? null;
  order.paymentMethod = paymentUpdate.paymentMethod ?? order.paymentMethod;
  order.paymentPayload = paymentUpdate.paymentPayload ?? order.paymentPayload ?? null;
  order.paidAt = paymentUpdate.paidAt ?? order.paidAt ?? null;

  if (!paymentUpdate.shouldApplyStock || order.stockApplied) {
    return order;
  }

  for (const item of order.items) {
    const product = store.products.find((entry) => entry.id === item.productId);

    if (!product || product.inventory < item.quantity) {
      order.status = "Paid - Manual Review";
      return order;
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
  return order;
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

export async function registerUser({ name, email, password, studentId, faculty, phone }) {
  if (!name || !email || !password) {
    throw createError("Nama, email, dan password wajib diisi.");
  }

  if (password.length < 6) {
    throw createError("Password minimal 6 karakter.");
  }

  return updateStore((store) => {
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
      joinedAt: new Date().toISOString(),
      role: resolveUserRole({
        email: normalizedEmail,
        users: store.users,
      }),
    };

    store.users.push(user);
    store.carts.push({ userId: user.id, items: [] });

    return {
      store,
      result: sanitizeUser(user, store.users),
    };
  });
}

export async function authenticateUser(email, password) {
  const store = await readStore();
  const normalizedEmail = email.trim().toLowerCase();
  const passwordHash = hashPassword(password);
  const user = store.users.find((entry) => entry.email === normalizedEmail && entry.passwordHash === passwordHash);

  if (!user) {
    throw createError("Email atau password tidak valid.", 401);
  }

  return sanitizeUser(user, store.users);
}

export async function createSessionForUser(userId) {
  return updateStore((store) => {
    const token = createToken();
    store.sessions = store.sessions.filter((session) => session.userId !== userId);
    store.sessions.push({
      token,
      userId,
      createdAt: new Date().toISOString(),
    });

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

export async function getUserBySessionToken(token) {
  if (!token) {
    return null;
  }

  const store = await readStore();
  const session = store.sessions.find((entry) => entry.token === token);

  if (!session) {
    return null;
  }

  return sanitizeUser(
    store.users.find((user) => user.id === session.userId),
    store.users,
  );
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

    return {
      store,
      result: order,
    };
  });
}

export async function createPendingOrder(userId, payload) {
  validateCheckoutPayload(payload);

  return updateStore((store) => {
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
    const order = store.orders.find((entry) => entry.orderNumber === orderNumber);

    if (!order) {
      throw createError("Pesanan tidak ditemukan.", 404);
    }

    applyPaymentUpdateToOrder(store, order, paymentUpdate);

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
  const user = sanitizeUser(
    store.users.find((entry) => entry.id === userId),
    store.users,
  );
  const orders = store.orders.filter((order) => order.userId === userId);
  const cart = buildCartSummary(store, userId);
  const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);

  return {
    user,
    cart,
    orders,
    stats: [
      { label: "Total Orders", value: String(orders.length) },
      { label: "Active Cart Items", value: String(cart.totalItems) },
      { label: "Total Spending", value: totalSpent },
      { label: "Preferred Payment", value: orders[0]?.paymentMethod ?? "M-Pay" },
    ],
    recommendations: store.products.filter((product) => product.featured).slice(0, 3),
  };
}

export async function getAdminDashboardData() {
  const store = await readStore();
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
    paymentOverview: [
      {
        label: "Pembayaran Lunas",
        value: String(orders.filter((order) => order.paymentStatus === "paid").length),
        description: "Jumlah order yang sudah tercatat lunas di sistem.",
      },
      {
        label: "Metode Favorit",
        value: orders[0]?.paymentMethod ?? "Belum ada order",
        description: "Metode pembayaran dari order terbaru yang masuk.",
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
    "Paid & Confirmed",
    "Preparing",
    "Ready for Pickup",
    "Out for Delivery",
    "Completed",
  ]);

  if (!allowedStatuses.has(nextStatus)) {
    throw createError("Status order tidak valid.", 400);
  }

  return updateStore((store) => {
    const order = store.orders.find((entry) => entry.orderNumber === orderNumber);

    if (!order) {
      throw createError("Pesanan tidak ditemukan.", 404);
    }

    order.status = nextStatus;

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
