import Link from "next/link";
import CartClient from "../../components/cart-client";
import { getCartByUserId } from "../../lib/market";
import { getCurrentUser } from "../../lib/session";

export default async function CartPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <main className="container content-section" style={{ maxWidth: '480px', margin: '0 auto', padding: '60px 16px' }}>
        <div className="stack-lg" style={{ textAlign: 'center' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))', margin: '0 auto', display: 'grid', placeItems: 'center' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
          </div>
          <div className="stack-sm">
            <h1 style={{ fontSize: 'clamp(1.3rem, 4vw, 1.8rem)' }}>Masuk untuk membuka keranjang Anda</h1>
            <p style={{ color: 'var(--muted)', maxWidth: '340px', margin: '0 auto' }}>Simpan item favorit, kelola kuantitas, dan lanjutkan ke checkout kapan saja.</p>
          </div>
          <div className="stack-sm" style={{ maxWidth: '280px', margin: '0 auto', width: '100%' }}>
            <Link href="/login?next=/cart" className="button button-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px' }}>
              Masuk
            </Link>
            <Link href="/register?next=/cart" className="button button-secondary" style={{ width: '100%', justifyContent: 'center', padding: '14px' }}>
              Daftar akun
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const cart = await getCartByUserId(user.id);

  return (
    <main className="container content-section stack-lg">
      <div className="section-heading" style={{ textAlign: 'center', maxWidth: '500px', margin: '0 auto' }}>
        <span className="badge badge-strong" style={{ margin: '0 auto' }}>Keranjang</span>
        <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.2rem)' }}>Keranjang Belanja</h1>
        <p>Perbarui jumlah item, hapus produk, lalu lanjutkan ke checkout.</p>
      </div>

      <CartClient initialCart={cart} />
    </main>
  );
}
