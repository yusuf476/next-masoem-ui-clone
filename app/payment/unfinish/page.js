import Link from "next/link";

export default function PaymentUnfinishPage() {
  return (
    <main className="container content-section">
      <section className="card empty-state stack-md">
        <span className="badge badge-soft">Payment Pending</span>
        <h1>Pembayaran belum diselesaikan</h1>
        <p>Transaksi Anda masih pending. Anda bisa melanjutkan pembayaran dari dashboard pesanan.</p>
        <div className="hero-actions">
          <Link href="/dashboard" className="button button-primary">
            Buka dashboard
          </Link>
          <Link href="/checkout" className="button button-secondary">
            Kembali ke checkout
          </Link>
        </div>
      </section>
    </main>
  );
}
