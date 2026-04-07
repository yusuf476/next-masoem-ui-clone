import Link from "next/link";

export default function PaymentErrorPage() {
  return (
    <main className="container content-section">
      <section className="card empty-state stack-md">
        <span className="badge badge-soft">Payment Error</span>
        <h1>Terjadi kendala saat membuka pembayaran</h1>
        <p>Silakan coba lagi dari dashboard atau checkout. Jika masalah berlanjut, cek konfigurasi Midtrans Anda.</p>
        <div className="hero-actions">
          <Link href="/dashboard" className="button button-primary">
            Buka dashboard
          </Link>
          <Link href="/checkout" className="button button-secondary">
            Coba lagi
          </Link>
        </div>
      </section>
    </main>
  );
}
