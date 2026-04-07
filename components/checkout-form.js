"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function formatCurrency(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function CheckoutForm({ user, cart }) {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: user.name,
    phone: user.phone === "-" ? "" : user.phone,
    address: "",
    notes: "",
    fulfillmentMethod: "delivery",
    paymentMethod: "M-Pay",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [redirecting, setRedirecting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    let shouldRedirect = false;

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Checkout gagal diproses.");
      }

      if (payload.payment?.redirectUrl) {
        shouldRedirect = true;
        setRedirecting(true);
        window.location.href = payload.payment.redirectUrl;
        return;
      }

      router.push(`/dashboard?order=${payload.order.orderNumber}`);
      router.refresh();
    } catch (error) {
      setMessage(error.message);
    } finally {
      if (!shouldRedirect) {
        setLoading(false);
      }
    }
  }

  const deliveryFee = form.fulfillmentMethod === "pickup" ? 0 : cart.deliveryFee;
  const total = cart.subtotal + cart.serviceFee + deliveryFee;

  return (
    <div className="checkout-layout">
      <form className="card checkout-form" onSubmit={handleSubmit}>
        <div className="section-heading">
          <span className="badge badge-strong">Checkout</span>
          <h1>Lengkapi data pesanan Anda</h1>
          <p>Masukkan detail pengiriman, catatan, dan metode pembayaran sebelum pesanan diproses.</p>
        </div>

        <div className="form-split">
          <label className="field">
            <span>Nama penerima</span>
            <input
              value={form.fullName}
              onChange={(event) => setForm({ ...form, fullName: event.target.value })}
              required
            />
          </label>
          <label className="field">
            <span>Nomor telepon</span>
            <input
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
              required
            />
          </label>
        </div>

        <label className="field">
          <span>Alamat pengantaran / lokasi pickup</span>
          <textarea
            value={form.address}
            onChange={(event) => setForm({ ...form, address: event.target.value })}
            rows="4"
            placeholder="Contoh: Gedung Fakultas Teknik, ruang 204"
            required
          />
        </label>

        <div className="form-split">
          <label className="field">
            <span>Metode fulfillment</span>
            <select
              value={form.fulfillmentMethod}
              onChange={(event) => setForm({ ...form, fulfillmentMethod: event.target.value })}
            >
              <option value="delivery">Campus delivery</option>
              <option value="pickup">Self pickup</option>
            </select>
          </label>

          <label className="field">
            <span>Preferensi pembayaran</span>
            <select
              value={form.paymentMethod}
              onChange={(event) => setForm({ ...form, paymentMethod: event.target.value })}
            >
              <option value="Midtrans Snap">Midtrans Snap</option>
              <option value="Virtual Account">Virtual Account</option>
              <option value="QRIS">QRIS</option>
            </select>
          </label>
        </div>

        <label className="field">
          <span>Catatan tambahan</span>
          <textarea
            value={form.notes}
            onChange={(event) => setForm({ ...form, notes: event.target.value })}
            rows="3"
            placeholder="Contoh: tanpa bawang, antar sebelum jam 12.00"
          />
        </label>

        {message ? <p className="helper-text helper-text-error">{message}</p> : null}
        <p className="helper-text">
          Setelah submit, Anda akan diarahkan ke halaman pembayaran Midtrans untuk menyelesaikan transaksi.
        </p>

        <button className="button button-primary" type="submit" disabled={loading || redirecting}>
          {redirecting ? "Mengarahkan ke Midtrans..." : loading ? "Menyiapkan pembayaran..." : "Lanjut ke Pembayaran"}
        </button>
      </form>

      <aside className="card order-summary">
        <h2>Order Summary</h2>
        <div className="stack-sm">
          {cart.items.map((item) => (
            <div key={item.productId} className="summary-item">
              <div>
                <strong>{item.name}</strong>
                <small>{item.quantity} item</small>
              </div>
              <span>{formatCurrency(item.lineTotal)}</span>
            </div>
          ))}
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
          <span>{form.fulfillmentMethod === "pickup" ? "Pickup fee" : "Delivery fee"}</span>
          <strong>{formatCurrency(deliveryFee)}</strong>
        </div>
        <div className="summary-row summary-total">
          <span>Total</span>
          <strong>{formatCurrency(total)}</strong>
        </div>
      </aside>
    </div>
  );
}
