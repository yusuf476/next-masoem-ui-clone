import { NextResponse } from "next/server";
import { createCheckoutSession } from "../../../lib/market";
import { getCurrentUser } from "../../../lib/session";

export async function POST(request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Silakan login terlebih dahulu." }, { status: 401 });
  }

  try {
    const payload = await request.json();
    const result = await createCheckoutSession(user, payload, {
      baseUrl: request.nextUrl.origin,
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Checkout gagal diproses." },
      { status: error.status || 500 },
    );
  }
}
