import { NextResponse } from "next/server";
import { authenticateUser, createSessionForUser } from "../../../../lib/market";
import { setSessionCookie } from "../../../../lib/session";

export async function POST(request) {
  try {
    const payload = await request.json();
    const user = await authenticateUser(payload.email, payload.password);
    const token = await createSessionForUser(user.id);
    const response = NextResponse.json({ user });
    setSessionCookie(response, token);
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Login gagal." },
      { status: error.status || 500 },
    );
  }
}
