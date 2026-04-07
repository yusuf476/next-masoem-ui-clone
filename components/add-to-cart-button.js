"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

export default function AddToCartButton({
  productId,
  disabled = false,
  requiresAuth = false,
  nextPath = "/",
  quantity = 1,
  size = "default",
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function handleAdd() {
    if (requiresAuth) {
      router.push(`/login?next=${encodeURIComponent(nextPath)}`);
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          quantity,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Gagal menambahkan produk.");
      }

      setMessage("Produk berhasil ditambahkan.");
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="stack-sm">
      <button
        className={`button button-primary ${size === "small" ? "button-small" : ""}`}
        onClick={handleAdd}
        disabled={disabled || loading}
      >
        {loading ? "Menambahkan..." : disabled ? "Stok Habis" : "Tambah ke Keranjang"}
      </button>
      {message ? <p className="helper-text helper-text-success">{message}</p> : null}
    </div>
  );
}
