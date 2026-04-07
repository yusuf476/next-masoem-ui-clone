import { NextResponse } from "next/server";
import { getOrdersByUserId } from "../../../lib/market";
import { getCurrentUser } from "../../../lib/session";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orders = await getOrdersByUserId(user.id);
  return NextResponse.json({ orders });
}
