import { NextResponse } from "next/server";
import { addProduct, isUserAdmin } from "../../../../lib/market";
import { getCurrentUser } from "../../../../lib/session";

async function requireAdmin() {
  const user = await getCurrentUser();

  if (!user || !isUserAdmin(user)) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }

  return user;
}

export async function POST(request) {
  try {
    await requireAdmin();
    const payload = await request.json();
    const product = await addProduct(payload);
    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Gagal menambahkan produk." },
      { status: error.status || 500 },
    );
  }
}
