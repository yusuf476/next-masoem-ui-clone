import Link from "next/link";
import CartClient from "../../components/cart-client";
import { getCartByUserId } from "../../lib/market";
import { getCurrentUser } from "../../lib/session";

export default async function CartPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <main className="container content-section">
        <div className="card empty-state">
          <h1>Masuk untuk membuka keranjang Anda</h1>
          <p>Simpan item favorit, kelola kuantitas, dan lanjutkan ke checkout kapan saja.</p>
          <div className="hero-actions">
            <Link href="/login?next=/cart" className="button button-primary">
              Masuk
            </Link>
            <Link href="/register?next=/cart" className="button button-secondary">
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
      <div className="section-heading">
        <span className="badge badge-strong">Cart</span>
        <h1>Keranjang belanja Anda</h1>
        <p>Perbarui jumlah item, hapus produk, lalu lanjutkan ke checkout.</p>
      </div>

      <CartClient initialCart={cart} />
    </main>
  );
}
