import { NextResponse } from "next/server";
import { requestEmailVerification, verifyEmailWithToken } from "../../../../lib/market";
import { getCurrentUser } from "../../../../lib/session";

export async function POST(request) {
  try {
    const payload = await request.json();

    if (payload.token?.trim()) {
      const user = await verifyEmailWithToken(payload.token);
      return NextResponse.json({
        ok: true,
        user,
        message: "Email berhasil diverifikasi.",
      });
    }

    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Silakan login terlebih dahulu." }, { status: 401 });
    }

    const result = await requestEmailVerification(currentUser.id);

    return NextResponse.json({
      ok: true,
      message: result.alreadyVerified
        ? "Email Anda sudah terverifikasi."
        : "Tautan verifikasi baru berhasil dibuat.",
      previewVerificationUrl:
        process.env.NODE_ENV === "production" || !result.verificationToken
          ? null
          : `${request.nextUrl.origin}/verify-email?token=${encodeURIComponent(result.verificationToken)}`,
      alreadyVerified: result.alreadyVerified,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Verifikasi email gagal diproses." },
      { status: error.status || 500 },
    );
  }
}
