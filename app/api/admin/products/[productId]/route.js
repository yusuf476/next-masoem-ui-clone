import { NextResponse } from "next/server";
import { isUserAdmin, updateAdminProductInventory } from "../../../../../lib/market";
import { getCurrentUser } from "../../../../../lib/session";

async function requireAdmin() {
  const user = await getCurrentUser();

  if (!user || !isUserAdmin(user)) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }

  return user;
}

export async function PATCH(request, { params }) {
  try {
    await requireAdmin();
    const payload = await request.json();
    const resolvedParams = await params;
    const product = await updateAdminProductInventory(
      resolvedParams.productId,
      Number(payload.inventory),
    );
    return NextResponse.json({ product });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Gagal memperbarui stok produk." },
      { status: error.status || 500 },
    );
  }
}
