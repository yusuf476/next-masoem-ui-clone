import { NextResponse } from "next/server";
import {
  getWishlistByUserId,
  mergeWishlistItems,
  toggleWishlistItem,
} from "../../../lib/market";
import { getCurrentUser } from "../../../lib/session";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Silakan login terlebih dahulu." }, { status: 401 });
  }

  const items = await getWishlistByUserId(user.id);
  return NextResponse.json({ items });
}

export async function POST(request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Silakan login terlebih dahulu." }, { status: 401 });
  }

  try {
    const payload = await request.json();

    if (!payload.productId?.trim()) {
      return NextResponse.json({ error: "Produk wishlist tidak valid." }, { status: 400 });
    }

    const result = await toggleWishlistItem(user.id, payload.productId);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Wishlist gagal diperbarui." },
      { status: error.status || 500 },
    );
  }
}

export async function PUT(request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Silakan login terlebih dahulu." }, { status: 401 });
  }

  try {
    const payload = await request.json();
    const items = await mergeWishlistItems(user.id, payload.productIds || []);
    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Sinkronisasi wishlist gagal." },
      { status: error.status || 500 },
    );
  }
}
