import { NextResponse } from "next/server";
import { addItemToCart, getCartByUserId } from "../../../lib/market";
import { getCurrentUser } from "../../../lib/session";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cart = await getCartByUserId(user.id);
  return NextResponse.json({ cart });
}

export async function POST(request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Silakan login terlebih dahulu." }, { status: 401 });
  }

  try {
    const payload = await request.json();
    const cart = await addItemToCart(user.id, payload.productId, Number(payload.quantity ?? 1));
    return NextResponse.json({ cart });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Gagal menambahkan ke keranjang." },
      { status: error.status || 500 },
    );
  }
}
