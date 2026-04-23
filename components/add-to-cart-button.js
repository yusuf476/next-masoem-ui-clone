"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "./toast";

export default function AddToCartButton({
  productId,
  disabled = false,
  requiresAuth = false,
  nextPath = "/",
  quantity = 1,
  size = "default",
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const addToast = useToast();

  async function handleAdd() {
    if (requiresAuth) {
      router.push(`/login?next=${encodeURIComponent(nextPath)}`);
      return;
    }

    setLoading(true);

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

      addToast("✅ Produk berhasil ditambahkan ke keranjang!", "success");
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      addToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      className={`button button-primary ${size === "small" ? "button-small" : ""}`}
      onClick={handleAdd}
      disabled={disabled || loading}
    >
      {loading ? "Menambahkan..." : disabled ? "Stok Habis" : "Tambah ke Keranjang"}
    </button>
  );
}
