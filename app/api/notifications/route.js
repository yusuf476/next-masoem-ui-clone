import { NextResponse } from "next/server";
import {
  getNotificationsByUserId,
  markNotificationsAsRead,
} from "../../../lib/market";
import { getCurrentUser } from "../../../lib/session";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Silakan login terlebih dahulu." }, { status: 401 });
  }

  const notifications = await getNotificationsByUserId(user.id);
  return NextResponse.json({ notifications });
}

export async function POST() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Silakan login terlebih dahulu." }, { status: 401 });
  }

  try {
    const notifications = await markNotificationsAsRead(user.id);
    return NextResponse.json({ notifications });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Notifikasi gagal diperbarui." },
      { status: error.status || 500 },
    );
  }
}
