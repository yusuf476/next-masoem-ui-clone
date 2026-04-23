import { redirect } from "next/navigation";
import CheckoutForm from "../../components/checkout-form";
import { getCartByUserId } from "../../lib/market";
import { getCurrentUser } from "../../lib/session";

export default async function CheckoutPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/checkout");
  }

  const cart = await getCartByUserId(user.id);

  if (cart.items.length === 0) {
    redirect("/cart");
  }

  return (
    <main className="container content-section">
      <div className="section-heading" style={{ textAlign: 'center', marginBottom: '40px' }}>
        <span className="badge badge-strong" style={{ margin: '0 auto' }}>Checkout</span>
        <h1>Selesaikan Pesanan Anda</h1>
        <p>Pilih metode pengiriman dan pembayaran untuk menyelesaikan transaksi.</p>
      </div>
      <CheckoutForm user={user} cart={cart} />
    </main>
  );
}
