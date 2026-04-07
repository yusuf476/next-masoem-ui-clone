import Link from "next/link";

export default function NotFound() {
  return (
    <main className="container content-section">
      <div className="card empty-state">
        <h1>Halaman tidak ditemukan</h1>
        <p>Alamat yang Anda tuju tidak tersedia. Silakan kembali ke beranda atau buka katalog produk.</p>
        <div className="hero-actions">
          <Link href="/" className="button button-primary">
            Kembali ke beranda
          </Link>
          <Link href="/products" className="button button-secondary">
            Buka katalog
          </Link>
        </div>
      </div>
    </main>
  );
}
