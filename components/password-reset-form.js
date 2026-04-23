"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function PasswordResetForm({ token }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    if (password !== confirmPassword) {
      setMessage("Konfirmasi password belum cocok.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Reset password gagal diproses.");
      }

      setSuccess(true);
      setMessage(payload.message);
      setTimeout(() => {
        router.push("/login");
      }, 1000);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="auth-form card" onSubmit={handleSubmit}>
      <div className="stack-sm">
        <span className="badge badge-strong">New Password</span>
        <h1>Buat password baru</h1>
        <p>Gunakan kombinasi minimal 8 karakter dengan huruf dan angka.</p>
      </div>

      <label className="field">
        <span>Password baru</span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Minimal 8 karakter"
          required
        />
      </label>

      <label className="field">
        <span>Konfirmasi password</span>
        <input
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="Ulangi password baru"
          required
        />
      </label>

      {message ? (
        <p className={`helper-text ${success ? "helper-text-success" : "helper-text-error"}`}>
          {message}
        </p>
      ) : null}

      <button className="button button-primary" type="submit" disabled={loading || !token}>
        {loading ? "Menyimpan..." : "Simpan password baru"}
      </button>

      <Link href="/login" className="button button-secondary button-small">
        Kembali ke login
      </Link>
    </form>
  );
}
