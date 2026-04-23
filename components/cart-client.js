"use client";

import { startTransition, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import EmptyState from "./empty-state";

function formatCurrency(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function CartClient({ initialCart }) {
  const [cart, setCart] = useState(initialCart);
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState("");
  const router = useRouter();
  const freeDeliveryGap = Math.max(0, 150000 - cart.subtotal);
  const progress = Math.min(100, Math.round((cart.subtotal / 150000) * 100));

  async function mutate(productId, method, quantity) {
    setBusyId(productId);
    setMessage("");

    try {
      const response = await fetch(`/api/cart/${productId}`, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: method === "PATCH" ? JSON.stringify({ quantity }) : undefined,
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Keranjang gagal diperbarui.");
      }

      setCart(payload.cart);
      setMessage("Keranjang berhasil diperbarui.");
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusyId("");
    }
  }

  if (cart.items.length === 0) {
    return (
      <EmptyState
        iconType="cart"
        title="Keranjang Anda Kosong"
        description="Belum ada item yang ditambahkan. Yuk, cari makanan favorit atau perlengkapan kampus Anda sekarang!"
      />
    );
  }

  return (
    <div className="cart-layout">
      <section className="stack-md">
        <article className="card cart-progress-card">
          <div className="stack-sm">
            <div className="summary-row">
              <strong>Progress bebas ongkir kampus</strong>
              <span>{progress}%</span>
            </div>
            <div className="progress-track">
              <span style={{ width: `${progress}%` }} />
            </div>
            <p>
              {freeDeliveryGap === 0
                ? "Subtotal Anda sudah memenuhi syarat bebas biaya delivery."
                : `Tambah ${formatCurrency(freeDeliveryGap)} lagi untuk gratis delivery.`}
            </p>
          </div>
        </article>

        {cart.items.map((item) => (
          <article key={item.productId} className="card cart-item">
            <img src={item.image} alt={item.name} className="cart-item-image" />
            <div className="cart-item-body">
              <div className="stack-xs">
                <h3>{item.name}</h3>
                <p>{item.category}</p>
                <strong>{formatCurrency(item.price)}</strong>
                <small>Total item: {formatCurrency(item.lineTotal)}</small>
              </div>

              <div className="cart-controls">
                <button
                  className="button button-secondary button-small"
                  onClick={() => mutate(item.productId, "PATCH", item.quantity - 1)}
                  disabled={busyId === item.productId}
                >
                  -
                </button>
                <span>{item.quantity}</span>
                <button
                  className="button button-secondary button-small"
                  onClick={() => mutate(item.productId, "PATCH", item.quantity + 1)}
                  disabled={busyId === item.productId}
                >
                  +
                </button>
                <button
                  className="button button-ghost button-small"
                  onClick={() => mutate(item.productId, "DELETE")}
                  disabled={busyId === item.productId}
                >
                  Hapus
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>

      <aside className="card order-summary">
        <h2>Ringkasan Belanja</h2>
        <div className="cart-summary-note">
          <strong>{cart.totalItems} item siap checkout</strong>
          <p>Pilih delivery atau pickup di langkah berikutnya sesuai kebutuhan Anda.</p>
        </div>
        <div className="summary-row">
          <span>Subtotal</span>
          <strong>{formatCurrency(cart.subtotal)}</strong>
        </div>
        <div className="summary-row">
          <span>Service fee</span>
          <strong>{formatCurrency(cart.serviceFee)}</strong>
        </div>
        <div className="summary-row">
          <span>Delivery fee</span>
          <strong>{formatCurrency(cart.deliveryFee)}</strong>
        </div>
        <div className="summary-row summary-total">
          <span>Total</span>
          <strong>{formatCurrency(cart.total)}</strong>
        </div>
        {message ? <p className={`helper-text ${message.includes("gagal") ? "helper-text-error" : "helper-text-success"}`}>{message}</p> : null}
        <Link href="/checkout" className="button button-primary">
          Lanjut ke Checkout
        </Link>
        <Link href="/products" className="button button-secondary">
          Tambah produk lagi
        </Link>
      </aside>
    </div>
  );
}
