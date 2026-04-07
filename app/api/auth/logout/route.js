import { NextResponse } from "next/server";
import { destroySession } from "../../../../lib/market";
import { clearSessionCookie, getCurrentSessionToken } from "../../../../lib/session";

export async function POST() {
  const token = await getCurrentSessionToken();

  if (token) {
    await destroySession(token);
  }

  const response = NextResponse.json({ success: true });
  clearSessionCookie(response);
  return response;
}
