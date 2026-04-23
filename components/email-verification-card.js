"use client";

import Link from "next/link";
import { useState } from "react";

export default function EmailVerificationCard({ emailVerifiedAt }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [previewVerificationUrl, setPreviewVerificationUrl] = useState("");

  async function handleRequestVerification() {
    setLoading(true);
    setMessage("");
    setPreviewVerificationUrl("");

    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Permintaan verifikasi email gagal.");
      }

      setMessage(payload.message);
      setPreviewVerificationUrl(payload.previewVerificationUrl || "");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  if (emailVerifiedAt) {
    return (
      <div className="card stack-sm" style={{ padding: "20px" }}>
        <span className="badge badge-soft">Email Aman</span>
        <strong>Email Anda sudah terverifikasi.</strong>
        <p>Verifikasi terakhir tercatat dan akun Anda sudah memenuhi rekomendasi keamanan dasar.</p>
      </div>
    );
  }

  return (
    <div className="card stack-sm" style={{ padding: "20px" }}>
      <span className="badge badge-strong">Perlu Verifikasi</span>
      <strong>Email Anda belum terverifikasi.</strong>
      <p>Aktifkan verifikasi email untuk mempermudah recovery akun dan menjaga keamanan login.</p>
      {message ? <p className="helper-text">{message}</p> : null}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <button
          type="button"
          className="button button-primary button-small"
          onClick={handleRequestVerification}
          disabled={loading}
        >
          {loading ? "Membuat link..." : "Kirim ulang link"}
        </button>
        {previewVerificationUrl ? (
          <Link href={previewVerificationUrl} className="button button-secondary button-small">
            Buka link verifikasi preview
          </Link>
        ) : null}
      </div>
    </div>
  );
}
