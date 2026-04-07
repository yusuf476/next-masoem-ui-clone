import { createHash } from "crypto";

function trimTrailingSlash(value) {
  return value?.trim().replace(/\/$/, "") || "";
}

export function isMidtransConfigured() {
  return Boolean(process.env.MIDTRANS_SERVER_KEY?.trim());
}

export function getMidtransEnvironment() {
  return process.env.MIDTRANS_IS_PRODUCTION === "true" ? "production" : "sandbox";
}

function getMidtransBaseUrls() {
  const production = getMidtransEnvironment() === "production";

  return {
    snap: production ? "https://app.midtrans.com" : "https://app.sandbox.midtrans.com",
    api: production ? "https://api.midtrans.com" : "https://api.sandbox.midtrans.com",
  };
}

function getAuthorizationHeader() {
  const serverKey = process.env.MIDTRANS_SERVER_KEY?.trim();

  if (!serverKey) {
    throw new Error("MIDTRANS_SERVER_KEY belum diatur.");
  }

  return `Basic ${Buffer.from(`${serverKey}:`).toString("base64")}`;
}

function getAppBaseUrl(baseUrl) {
  return trimTrailingSlash(process.env.NEXT_PUBLIC_APP_URL) || trimTrailingSlash(baseUrl);
}

function toMidtransItem(item) {
  return {
    id: item.productId,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
  };
}

function toFeeItem(id, name, value) {
  return {
    id,
    name,
    price: value,
    quantity: 1,
  };
}

async function midtransRequest(url, options = {}) {
  const response = await fetch(url, {
    method: options.method || "GET",
    headers: {
      Accept: "application/json",
      Authorization: getAuthorizationHeader(),
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  const payload = await response.text();
  const data = payload ? JSON.parse(payload) : null;

  if (!response.ok) {
    const error = new Error(data?.status_message || data?.error_messages?.[0] || "Permintaan Midtrans gagal.");
    error.status = response.status;
    error.payload = data;
    throw error;
  }

  return data;
}

export async function createMidtransTransaction({ order, customer, cart, baseUrl }) {
  const urls = getMidtransBaseUrls();
  const appBaseUrl = getAppBaseUrl(baseUrl);
  const itemDetails = [
    ...cart.items.map((item) => toMidtransItem(item)),
    ...(cart.serviceFee > 0 ? [toFeeItem("service-fee", "Service Fee", cart.serviceFee)] : []),
    ...(cart.deliveryFee > 0 ? [toFeeItem("delivery-fee", "Delivery Fee", cart.deliveryFee)] : []),
  ];
  const headers = appBaseUrl
    ? {
        "X-Override-Notification": `${appBaseUrl}/api/payments/midtrans/notification`,
      }
    : {};

  const payload = await midtransRequest(`${urls.snap}/snap/v1/transactions`, {
    method: "POST",
    headers,
    body: {
      transaction_details: {
        order_id: order.orderNumber,
        gross_amount: order.total,
      },
      customer_details: {
        first_name: customer.name,
        email: customer.email,
        phone: order.shipping.phone,
      },
      item_details: itemDetails,
      callbacks: appBaseUrl
        ? {
            finish: `${appBaseUrl}/payment/finish?order=${encodeURIComponent(order.orderNumber)}`,
          }
        : undefined,
    },
  });

  return {
    token: payload?.token ?? null,
    redirectUrl: payload?.redirect_url ?? null,
  };
}

export async function getMidtransTransactionStatus(orderNumber) {
  const urls = getMidtransBaseUrls();
  return midtransRequest(`${urls.api}/v2/${encodeURIComponent(orderNumber)}/status`);
}

export function verifyMidtransNotificationSignature(notification) {
  const serverKey = process.env.MIDTRANS_SERVER_KEY?.trim();

  if (!serverKey) {
    return false;
  }

  const expected = createHash("sha512")
    .update(
      `${notification.order_id ?? ""}${notification.status_code ?? ""}${notification.gross_amount ?? ""}${serverKey}`,
    )
    .digest("hex");

  return expected === notification.signature_key;
}

export function mapMidtransTransactionToPaymentUpdate(payload) {
  const transactionStatus = payload.transaction_status || "pending";
  const fraudStatus = payload.fraud_status || null;
  const paymentType = payload.payment_type || null;
  const isSettled =
    transactionStatus === "settlement" ||
    (transactionStatus === "capture" && (!fraudStatus || fraudStatus === "accept"));

  if (isSettled) {
    return {
      status: "Paid & Confirmed",
      paymentStatus: "paid",
      paymentMethod: paymentType || "Midtrans",
      paymentReference: payload.transaction_id || payload.order_id,
      paymentProvider: "midtrans",
      paymentPayload: payload,
      paidAt: new Date().toISOString(),
      shouldApplyStock: true,
    };
  }

  if (transactionStatus === "pending" || transactionStatus === "authorize" || transactionStatus === "challenge") {
    return {
      status: "Awaiting Payment",
      paymentStatus: "pending",
      paymentMethod: paymentType || "Midtrans",
      paymentReference: payload.transaction_id || payload.order_id,
      paymentProvider: "midtrans",
      paymentPayload: payload,
      shouldApplyStock: false,
    };
  }

  if (transactionStatus === "expire") {
    return {
      status: "Payment Expired",
      paymentStatus: "expired",
      paymentMethod: paymentType || "Midtrans",
      paymentReference: payload.transaction_id || payload.order_id,
      paymentProvider: "midtrans",
      paymentPayload: payload,
      shouldApplyStock: false,
    };
  }

  return {
    status: "Payment Failed",
    paymentStatus: "failed",
    paymentMethod: paymentType || "Midtrans",
    paymentReference: payload.transaction_id || payload.order_id,
    paymentProvider: "midtrans",
    paymentPayload: payload,
    shouldApplyStock: false,
  };
}
