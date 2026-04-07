import { NextResponse } from "next/server";
import { getCatalog } from "../../../lib/market";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "all";
  const payload = await getCatalog({ search, category });
  return NextResponse.json(payload);
}
