import { NextResponse } from "next/server";
import { getCartByUserId, removeCartItem, updateCartItem } from "../../../../lib/market";
import { getCurrentUser } from "../../../../lib/session";

async function ensureUser() {
  const user = await getCurrentUser();

  if (!user) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }

  return user;
}

export async function PATCH(request, { params }) {
  try {
    const user = await ensureUser();
    const resolvedParams = await params;
    const payload = await request.json();
    const cart = await updateCartItem(user.id, resolvedParams.productId, Number(payload.quantity ?? 1));
    return NextResponse.json({ cart });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Gagal memperbarui keranjang." },
      { status: error.status || 500 },
    );
  }
}

export async function DELETE(_request, { params }) {
  try {
    const user = await ensureUser();
    const resolvedParams = await params;
    const cart = await removeCartItem(user.id, resolvedParams.productId);
    return NextResponse.json({ cart });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Gagal menghapus item." },
      { status: error.status || 500 },
    );
  }
}

export async function GET() {
  try {
    const user = await ensureUser();
    const cart = await getCartByUserId(user.id);
    return NextResponse.json({ cart });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Gagal mengambil keranjang." },
      { status: error.status || 500 },
    );
  }
}
