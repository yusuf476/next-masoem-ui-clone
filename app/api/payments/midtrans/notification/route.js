import { NextResponse } from "next/server";
import { applyOrderPaymentUpdate } from "../../../../../lib/market";
import {
  isMidtransConfigured,
  mapMidtransTransactionToPaymentUpdate,
  verifyMidtransNotificationSignature,
} from "../../../../../lib/midtrans";

export async function POST(request) {
  if (!isMidtransConfigured()) {
    return NextResponse.json({ error: "Midtrans belum dikonfigurasi." }, { status: 503 });
  }

  try {
    const payload = await request.json();

    if (!verifyMidtransNotificationSignature(payload)) {
      return NextResponse.json({ error: "Signature Midtrans tidak valid." }, { status: 401 });
    }

    const order = await applyOrderPaymentUpdate(
      payload.order_id,
      mapMidtransTransactionToPaymentUpdate(payload),
    );

    return NextResponse.json({ received: true, orderNumber: order.orderNumber });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Webhook Midtrans gagal diproses." },
      { status: error.status || 500 },
    );
  }
}
