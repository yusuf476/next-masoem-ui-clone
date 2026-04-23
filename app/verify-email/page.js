"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [state, setState] = useState({
    loading: true,
    success: false,
    message: "Memverifikasi email...",
  });

  useEffect(() => {
    async function verifyEmail() {
      if (!token) {
        setState({
          loading: false,
          success: false,
          message: "Token verifikasi tidak ditemukan.",
        });
        return;
      }

      try {
        const response = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || "Verifikasi email gagal diproses.");
        }

        setState({
          loading: false,
          success: true,
          message: payload.message,
        });
      } catch (error) {
        setState({
          loading: false,
          success: false,
          message: error.message,
        });
      }
    }

    verifyEmail();
  }, [token]);

  return (
    <main className="container content-section" style={{ maxWidth: "640px" }}>
      <section className="card stack-md" style={{ padding: "32px" }}>
        <span className="badge badge-strong">Email Verification</span>
        <h1>{state.loading ? "Memverifikasi..." : state.success ? "Email terverifikasi" : "Verifikasi gagal"}</h1>
        <p>{state.message}</p>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <Link href="/profile" className="button button-primary">
            Buka profil
          </Link>
          <Link href="/login" className="button button-secondary">
            Ke halaman login
          </Link>
        </div>
      </section>
    </main>
  );
}
