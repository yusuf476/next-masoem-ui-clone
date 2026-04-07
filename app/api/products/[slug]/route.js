import { NextResponse } from "next/server";
import { getProductBySlug } from "../../../../lib/market";

export async function GET(_request, { params }) {
  const resolvedParams = await params;
  const product = await getProductBySlug(resolvedParams.slug);

  if (!product) {
    return NextResponse.json({ error: "Produk tidak ditemukan." }, { status: 404 });
  }

  return NextResponse.json({ product });
}
