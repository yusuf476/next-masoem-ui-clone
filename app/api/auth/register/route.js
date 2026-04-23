import { NextResponse } from "next/server";
import { createSessionForUser, registerUser } from "../../../../lib/market";
import { setSessionCookie } from "../../../../lib/session";

export async function POST(request) {
  try {
    const payload = await request.json();
    const result = await registerUser(payload);
    const token = await createSessionForUser(result.user.id);
    const response = NextResponse.json({
      user: result.user,
      verificationUrl:
        process.env.NODE_ENV === "production" || !result.verificationToken
          ? null
          : `${request.nextUrl.origin}/verify-email?token=${encodeURIComponent(result.verificationToken)}`,
    });
    setSessionCookie(response, token);
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Registrasi gagal." },
      { status: error.status || 500 },
    );
  }
}
