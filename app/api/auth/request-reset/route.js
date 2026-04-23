import { NextResponse } from "next/server";
import { requestPasswordReset } from "../../../../lib/market";

export async function POST(request) {
  try {
    const payload = await request.json();

    if (!payload.email?.trim()) {
      return NextResponse.json({ error: "Email wajib diisi." }, { status: 400 });
    }

    const result = await requestPasswordReset(payload.email);

    return NextResponse.json({
      ok: true,
      message: "Jika email terdaftar, tautan reset password sudah dibuat.",
      previewResetUrl:
        process.env.NODE_ENV === "production" || !result.resetToken
          ? null
          : `${request.nextUrl.origin}/reset-password?token=${encodeURIComponent(result.resetToken)}`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Permintaan reset password gagal diproses." },
      { status: error.status || 500 },
    );
  }
}
