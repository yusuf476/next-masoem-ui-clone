import { promises as fs } from "fs";
import path from "path";

const dataDirectory = path.join(process.cwd(), "data");
const dataFile = path.join(dataDirectory, "store.json");
const fallbackStore = {
  users: [],
  sessions: [],
  carts: [],
  orders: [],
  categories: [],
  products: [],
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeStore(store) {
  return {
    users: Array.isArray(store?.users) ? store.users : [],
    sessions: Array.isArray(store?.sessions) ? store.sessions : [],
    carts: Array.isArray(store?.carts) ? store.carts : [],
    orders: Array.isArray(store?.orders) ? store.orders : [],
    categories: Array.isArray(store?.categories) ? store.categories : [],
    products: Array.isArray(store?.products) ? store.products : [],
  };
}

function getSupabaseUrl() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, "") ||
    process.env.SUPABASE_URL?.trim().replace(/\/$/, "") ||
    ""
  );
}

function getSupabaseServiceRoleKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "";
}

export function isSupabaseConfigured() {
  return Boolean(getSupabaseUrl() && getSupabaseServiceRoleKey());
}

export function getDataSourceLabel() {
  return isSupabaseConfigured() ? "Supabase PostgreSQL" : "Local JSON Store";
}

async function ensureLocalStore() {
  await fs.mkdir(dataDirectory, { recursive: true });

  try {
    await fs.access(dataFile);
  } catch {
    await fs.writeFile(dataFile, JSON.stringify(fallbackStore, null, 2), "utf8");
  }
}

async function readLocalStore() {
  await ensureLocalStore();
  const raw = await fs.readFile(dataFile, "utf8");
  return normalizeStore(JSON.parse(raw));
}

async function writeLocalStore(store) {
  await ensureLocalStore();
  await fs.writeFile(dataFile, JSON.stringify(normalizeStore(store), null, 2), "utf8");
}

function buildSupabaseHeaders({ prefer } = {}) {
  const serviceRoleKey = getSupabaseServiceRoleKey();

  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    "Content-Type": "application/json",
    ...(prefer ? { Prefer: prefer } : {}),
  };
}

async function supabaseRequest(resource, options = {}) {
  const url = `${getSupabaseUrl()}/rest/v1/${resource}`;
  const response = await fetch(url, {
    method: options.method || "GET",
    headers: buildSupabaseHeaders({ prefer: options.prefer }),
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  if (response.status === 204) {
    return null;
  }

  const payload = await response.text();

  if (!response.ok) {
    let message = payload;

    try {
      const parsed = payload ? JSON.parse(payload) : null;
      message = parsed?.message || parsed?.error_description || parsed?.hint || payload;
    } catch {
      message = payload;
    }

    throw new Error(message || "Permintaan ke Supabase gagal.");
  }

  return payload ? JSON.parse(payload) : null;
}

function toSupabaseFilterList(values) {
  return values
    .map((value) => `"${String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`)
    .join(",");
}

async function fetchSupabaseTable(table, { orderBy, ascending = true } = {}) {
  const searchParams = new URLSearchParams();
  searchParams.set("select", "*");

  if (orderBy) {
    searchParams.set("order", `${orderBy}.${ascending ? "asc" : "desc"}`);
  }

  return (await supabaseRequest(`${table}?${searchParams.toString()}`)) ?? [];
}

async function syncSupabaseTable(table, key, rows) {
  const existingRows = await supabaseRequest(`${table}?select=${encodeURIComponent(key)}`);
  const existingKeys = (existingRows ?? []).map((row) => row[key]).filter(Boolean);
  const nextKeys = rows.map((row) => row[key]).filter(Boolean);
  const deletedKeys = existingKeys.filter((value) => !nextKeys.includes(value));

  if (rows.length > 0) {
    await supabaseRequest(`${table}?on_conflict=${encodeURIComponent(key)}`, {
      method: "POST",
      body: rows,
      prefer: "resolution=merge-duplicates,return=minimal",
    });
  }

  if (deletedKeys.length > 0) {
    const searchParams = new URLSearchParams();
    searchParams.set(key, `in.(${toSupabaseFilterList(deletedKeys)})`);

    await supabaseRequest(`${table}?${searchParams.toString()}`, {
      method: "DELETE",
      prefer: "return=minimal",
    });
  }
}

function mapUserRow(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
    studentId: row.student_id,
    faculty: row.faculty,
    phone: row.phone,
    joinedAt: row.joined_at,
    role: row.role,
  };
}

function mapSessionRow(row) {
  return {
    token: row.token,
    userId: row.user_id,
    createdAt: row.created_at,
  };
}

function mapCartRow(row) {
  return {
    userId: row.user_id,
    items: Array.isArray(row.items) ? row.items : [],
  };
}

function mapOrderRow(row) {
  return {
    id: row.id,
    orderNumber: row.order_number,
    userId: row.user_id,
    status: row.status,
    paymentStatus: row.payment_status,
    paymentReference: row.payment_reference,
    paymentProvider: row.payment_provider,
    createdAt: row.created_at,
    estimatedReadyAt: row.estimated_ready_at,
    fulfillmentMethod: row.fulfillment_method,
    paymentMethod: row.payment_method,
    paymentToken: row.payment_token,
    paymentUrl: row.payment_url,
    paymentPayload: row.payment_payload ?? null,
    stockApplied: Boolean(row.stock_applied),
    paidAt: row.paid_at,
    notes: row.notes,
    shipping: row.shipping ?? {},
    items: Array.isArray(row.items) ? row.items : [],
    subtotal: row.subtotal ?? 0,
    serviceFee: row.service_fee ?? 0,
    deliveryFee: row.delivery_fee ?? 0,
    total: row.total ?? 0,
  };
}

function mapCategoryRow(row) {
  return {
    slug: row.slug,
    name: row.name,
    description: row.description,
  };
}

function mapProductRow(row) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category,
    price: row.price,
    rating: row.rating,
    reviews: row.reviews,
    featured: Boolean(row.featured),
    inventory: row.inventory,
    tagline: row.tagline,
    description: row.description,
    features: Array.isArray(row.features) ? row.features : [],
    image: row.image,
  };
}

function toUserRow(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    password_hash: user.passwordHash,
    student_id: user.studentId,
    faculty: user.faculty,
    phone: user.phone,
    joined_at: user.joinedAt,
    role: user.role ?? "customer",
  };
}

function toSessionRow(session) {
  return {
    token: session.token,
    user_id: session.userId,
    created_at: session.createdAt,
  };
}

function toCartRow(cart) {
  return {
    user_id: cart.userId,
    items: Array.isArray(cart.items) ? cart.items : [],
  };
}

function toOrderRow(order) {
  return {
    id: order.id,
    order_number: order.orderNumber,
    user_id: order.userId,
    status: order.status,
    payment_status: order.paymentStatus ?? "paid",
    payment_reference: order.paymentReference ?? null,
    payment_provider: order.paymentProvider ?? null,
    created_at: order.createdAt,
    estimated_ready_at: order.estimatedReadyAt,
    fulfillment_method: order.fulfillmentMethod,
    payment_method: order.paymentMethod,
    payment_token: order.paymentToken ?? null,
    payment_url: order.paymentUrl ?? null,
    payment_payload: order.paymentPayload ?? null,
    stock_applied: Boolean(order.stockApplied),
    paid_at: order.paidAt ?? null,
    notes: order.notes ?? "",
    shipping: order.shipping ?? {},
    items: Array.isArray(order.items) ? order.items : [],
    subtotal: order.subtotal ?? 0,
    service_fee: order.serviceFee ?? 0,
    delivery_fee: order.deliveryFee ?? 0,
    total: order.total ?? 0,
  };
}

function toCategoryRow(category) {
  return {
    slug: category.slug,
    name: category.name,
    description: category.description,
  };
}

function toProductRow(product) {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    category: product.category,
    price: product.price,
    rating: product.rating,
    reviews: product.reviews,
    featured: Boolean(product.featured),
    inventory: product.inventory,
    tagline: product.tagline,
    description: product.description,
    features: Array.isArray(product.features) ? product.features : [],
    image: product.image,
  };
}

async function seedSupabaseCatalogIfEmpty(categories, products) {
  if (categories.length > 0 || products.length > 0) {
    return { categories, products };
  }

  const localSeed = await readLocalStore();

  if (localSeed.categories.length === 0 && localSeed.products.length === 0) {
    return { categories, products };
  }

  await Promise.all([
    syncSupabaseTable(
      "categories",
      "slug",
      localSeed.categories.map((category) => toCategoryRow(category)),
    ),
    syncSupabaseTable(
      "products",
      "id",
      localSeed.products.map((product) => toProductRow(product)),
    ),
  ]);

  return {
    categories: localSeed.categories,
    products: localSeed.products,
  };
}

async function readSupabaseStore() {
  const [users, sessions, carts, orders, categories, products] = await Promise.all([
    fetchSupabaseTable("users", { orderBy: "joined_at", ascending: false }),
    fetchSupabaseTable("sessions", { orderBy: "created_at", ascending: false }),
    fetchSupabaseTable("carts"),
    fetchSupabaseTable("orders", { orderBy: "created_at", ascending: false }),
    fetchSupabaseTable("categories"),
    fetchSupabaseTable("products"),
  ]);

  const catalog = await seedSupabaseCatalogIfEmpty(
    categories.map((row) => mapCategoryRow(row)),
    products.map((row) => mapProductRow(row)),
  );

  return normalizeStore({
    users: users.map((row) => mapUserRow(row)),
    sessions: sessions.map((row) => mapSessionRow(row)),
    carts: carts.map((row) => mapCartRow(row)),
    orders: orders.map((row) => mapOrderRow(row)),
    categories: catalog.categories,
    products: catalog.products,
  });
}

async function writeSupabaseStore(store) {
  const normalizedStore = normalizeStore(store);

  await Promise.all([
    syncSupabaseTable(
      "users",
      "id",
      normalizedStore.users.map((user) => toUserRow(user)),
    ),
    syncSupabaseTable(
      "sessions",
      "token",
      normalizedStore.sessions.map((session) => toSessionRow(session)),
    ),
    syncSupabaseTable(
      "carts",
      "user_id",
      normalizedStore.carts.map((cart) => toCartRow(cart)),
    ),
    syncSupabaseTable(
      "orders",
      "id",
      normalizedStore.orders.map((order) => toOrderRow(order)),
    ),
    syncSupabaseTable(
      "categories",
      "slug",
      normalizedStore.categories.map((category) => toCategoryRow(category)),
    ),
    syncSupabaseTable(
      "products",
      "id",
      normalizedStore.products.map((product) => toProductRow(product)),
    ),
  ]);
}

export async function readStore() {
  if (isSupabaseConfigured()) {
    try {
      return await readSupabaseStore();
    } catch (error) {
      console.warn("Supabase read failed, falling back to local store:", error.message);
    }
  }

  return readLocalStore();
}

export async function writeStore(store) {
  if (isSupabaseConfigured()) {
    try {
      await writeSupabaseStore(store);
      return;
    } catch (error) {
      console.warn("Supabase write failed:", error.message);

      if (process.env.NODE_ENV === "production") {
        const supabaseError = new Error(
          "Supabase belum siap dipakai untuk menyimpan data. Jalankan schema SQL terlebih dahulu.",
        );
        supabaseError.status = 503;
        throw supabaseError;
      }
    }
  }

  await writeLocalStore(store);
}

export async function updateStore(updater) {
  const current = await readStore();
  const draft = clone(current);
  const outcome = await updater(draft);
  const nextStore = outcome && typeof outcome === "object" && "store" in outcome ? outcome.store : draft;

  await writeStore(nextStore);

  if (outcome && typeof outcome === "object" && "result" in outcome) {
    return outcome.result;
  }

  return nextStore;
}
