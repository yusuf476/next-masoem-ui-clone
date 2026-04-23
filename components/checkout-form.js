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

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Checkout gagal diproses.");
      }

      const orderNumber = payload.order ? payload.order.orderNumber : "ORD-" + Math.floor(Math.random() * 1000000);
      
      // Navigate to success page
      router.push(`/checkout/success?order=${orderNumber}`);
      router.refresh();
    } catch (error) {
      setMessage(error.message);
      setLoading(false);
    }
  }

  const deliveryFee = form.fulfillmentMethod === "pickup" ? 0 : cart.deliveryFee;
  const total = cart.subtotal + cart.serviceFee + deliveryFee;

  return (
    <div className="checkout-page-layout">
      <form className="checkout-steps" onSubmit={handleSubmit}>
        
        {/* Step 1: Pengiriman */}
        <div className="checkout-step-card">
          <div className="checkout-step-header">
            <div className="step-number">1</div>
            <h2 className="step-title">Informasi Pengiriman</h2>
          </div>
          
          <div className="form-split">
            <label className="field">
              <span>Nama Lengkap penerima</span>
              <input
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                required
                placeholder="Sesuai KTP/KTM"
              />
            </label>
            <label className="field">
              <span>Nomor WhatsApp aktif</span>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
                placeholder="Contoh: 081234..."
              />
            </label>
          </div>

          <label className="field">
            <span>Alamat Pengiriman / Fakultas</span>
            <textarea
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              rows="3"
              placeholder="Contoh: Gedung Fakultas Teknik, Lantai 2 Ruang Himpunan"
              required
            />
          </label>

          <div className="form-split">
            <label className="field">
              <span>Metode Pengambilan</span>
              <select
                value={form.fulfillmentMethod}
                onChange={(e) => setForm({ ...form, fulfillmentMethod: e.target.value })}
              >
                <option value="delivery">Campus Delivery (Diantar ke ruangan)</option>
                <option value="pickup">Self Pickup (Ambil di toko)</option>
              </select>
            </label>
            <label className="field">
              <span>Catatan Tambahan (opsional)</span>
              <input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Tanpa bawang, dsb..."
              />
            </label>
          </div>
        </div>

        {/* Step 2: Pembayaran */}
        <div className="checkout-step-card">
          <div className="checkout-step-header">
            <div className="step-number">2</div>
            <h2 className="step-title">Metode Pembayaran</h2>
          </div>

          <div className="payment-method-grid">
            <div 
              className={`payment-method-card ${form.paymentMethod === 'M-Pay' ? 'active' : ''}`}
              onClick={() => setForm({ ...form, paymentMethod: 'M-Pay' })}
            >
              <span className="payment-method-icon">💳</span>
              <strong>Masoem Pay</strong>
              <small style={{display: 'block', color: 'var(--muted)', marginTop: '4px'}}>Saldo: Rp 250.000</small>
            </div>
            
            <div 
              className={`payment-method-card ${form.paymentMethod === 'QRIS' ? 'active' : ''}`}
              onClick={() => setForm({ ...form, paymentMethod: 'QRIS' })}
            >
              <span className="payment-method-icon">📱</span>
              <strong>QRIS</strong>
              <small style={{display: 'block', color: 'var(--muted)', marginTop: '4px'}}>Gopay, OVO, Dana</small>
            </div>

            <div 
              className={`payment-method-card ${form.paymentMethod === 'Cash' ? 'active' : ''}`}
              onClick={() => setForm({ ...form, paymentMethod: 'Cash' })}
            >
              <span className="payment-method-icon">💵</span>
              <strong>Tunai / COD</strong>
              <small style={{display: 'block', color: 'var(--muted)', marginTop: '4px'}}>Bayar di tempat</small>
            </div>
          </div>
        </div>

        {message && <p className="helper-text helper-text-error" style={{ textAlign: 'center' }}>{message}</p>}

        <button 
          className="button button-primary" 
          type="submit" 
          disabled={loading}
          style={{ width: '100%', padding: '16px', fontSize: '1.1rem', marginTop: '16px' }}
        >
          {loading ? "Memproses Pesanan..." : "Bayar Sekarang"}
        </button>

      </form>

      {/* Sidebar Summary */}
      <aside className="checkout-sidebar">
        <div className="card order-summary" style={{ position: 'sticky', top: '100px' }}>
          <h2>Ringkasan Pesanan</h2>
          
          <div className="stack-sm" style={{ margin: '24px 0', padding: '0 0 24px 0', borderBottom: '1px dashed var(--border-strong)' }}>
            {cart.items.map((item) => (
              <div key={item.productId} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <img src={item.image} alt={item.name} style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }} />
                <div style={{ flex: 1 }}>
                  <strong style={{ display: 'block', fontSize: '0.9rem' }}>{item.name}</strong>
                  <small style={{ color: 'var(--muted)' }}>{item.quantity} x {formatCurrency(item.price)}</small>
                </div>
                <strong>{formatCurrency(item.lineTotal)}</strong>
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
          <div className="summary-row summary-total" style={{ borderTop: '2px solid var(--border-strong)', paddingTop: '16px', marginTop: '16px' }}>
            <span>Total Tagihan</span>
            <strong style={{ color: 'var(--primary)', fontSize: '1.4rem' }}>{formatCurrency(total)}</strong>
          </div>
        </div>
      </aside>
    </div>
  );
}
