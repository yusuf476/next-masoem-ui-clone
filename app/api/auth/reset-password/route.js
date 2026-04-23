import { NextResponse } from "next/server";
import { resetPasswordWithToken } from "../../../../lib/market";

export async function POST(request) {
  try {
    const payload = await request.json();

    if (!payload.token?.trim() || !payload.password?.trim()) {
      return NextResponse.json(
        { error: "Token reset dan password baru wajib diisi." },
        { status: 400 },
      );
    }

    await resetPasswordWithToken(payload.token, payload.password);

    return NextResponse.json({
      ok: true,
      message: "Password berhasil diperbarui. Silakan login dengan password baru.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Reset password gagal diproses." },
      { status: error.status || 500 },
    );
  }
}
