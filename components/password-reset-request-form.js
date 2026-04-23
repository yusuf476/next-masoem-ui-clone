"use client";

import Link from "next/link";
import { useState } from "react";

export default function PasswordResetRequestForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [previewResetUrl, setPreviewResetUrl] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setPreviewResetUrl("");

    try {
      const response = await fetch("/api/auth/request-reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Permintaan reset password gagal.");
      }

      setMessage(payload.message);
      setPreviewResetUrl(payload.previewResetUrl || "");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="auth-form card" onSubmit={handleSubmit}>
      <div className="stack-sm">
        <span className="badge badge-strong">Password Help</span>
        <h1>Reset password akun Anda</h1>
        <p>Masukkan email yang terdaftar. Kami akan buatkan tautan reset password baru.</p>
      </div>

      <label className="field">
        <span>Email</span>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="student@masoem.ac.id"
          required
        />
      </label>

      {message ? <p className="helper-text">{message}</p> : null}
      {previewResetUrl ? (
        <Link href={previewResetUrl} className="button button-secondary button-small">
          Buka tautan reset preview
        </Link>
      ) : null}

      <button className="button button-primary" type="submit" disabled={loading}>
        {loading ? "Memproses..." : "Kirim tautan reset"}
      </button>
    </form>
  );
}
