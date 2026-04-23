"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const initialRegisterState = {
  name: "",
  email: "",
  password: "",
  studentId: "",
  faculty: "",
  phone: "",
};

const initialLoginState = {
  email: "",
  password: "",
};

export default function AuthForm({ mode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = useMemo(() => searchParams.get("next") || "/dashboard", [searchParams]);
  const [form, setForm] = useState(mode === "register" ? initialRegisterState : initialLoginState);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const endpoint = mode === "register" ? "/api/auth/register" : "/api/auth/login";

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Permintaan gagal diproses.");
      }

      router.push(nextPath);
      router.refresh();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="auth-form card" onSubmit={handleSubmit}>
      <div className="stack-sm">
        <span className="badge badge-strong">{mode === "register" ? "Create account" : "Welcome back"}</span>
        <h1>{mode === "register" ? "Buat akun mahasiswa Anda" : "Masuk ke Masoem Market"}</h1>
        <p>
          {mode === "register"
            ? "Daftarkan akun untuk mulai berbelanja, menyimpan keranjang, dan melacak pesanan."
            : "Masuk untuk mengakses keranjang, checkout, dan dashboard pesanan Anda."}
        </p>
      </div>

      {mode === "register" ? (
        <>
          <label className="field">
            <span>Nama lengkap</span>
            <input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="Contoh: Budi Santoso"
              required
            />
          </label>
          <div className="form-split">
            <label className="field">
              <span>NIM</span>
              <input
                value={form.studentId}
                onChange={(event) => setForm({ ...form, studentId: event.target.value })}
                placeholder="2026123001"
              />
            </label>
            <label className="field">
              <span>Fakultas</span>
              <input
                value={form.faculty}
                onChange={(event) => setForm({ ...form, faculty: event.target.value })}
                placeholder="Informatika"
              />
            </label>
          </div>
          <label className="field">
            <span>Nomor telepon</span>
            <input
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
              placeholder="+62 812 0000 0000"
            />
          </label>
        </>
      ) : null}

      <label className="field">
        <span>Email</span>
        <input
          type="email"
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
          placeholder="student@masoem.ac.id"
          required
        />
      </label>

      <label className="field">
        <span>Password</span>
        <input
          type="password"
          value={form.password}
          onChange={(event) => setForm({ ...form, password: event.target.value })}
          placeholder="Minimal 8 karakter"
          required
        />
      </label>

      {mode === "login" ? (
        <Link href="/forgot-password" style={{ justifySelf: "end", fontSize: "0.9rem", color: "var(--primary)" }}>
          Lupa password?
        </Link>
      ) : (
        <p style={{ fontSize: "0.9rem" }}>
          Setelah akun dibuat, Anda bisa memverifikasi email dari halaman profil agar keamanan akun lebih kuat.
        </p>
      )}

      {message ? <p className="helper-text helper-text-error">{message}</p> : null}

      <button className="button button-primary" type="submit" disabled={loading}>
        {loading ? "Memproses..." : mode === "register" ? "Buat akun" : "Masuk"}
      </button>
    </form>
  );
}
