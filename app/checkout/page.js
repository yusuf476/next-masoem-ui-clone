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
      <CheckoutForm user={user} cart={cart} />
    </main>
  );
}
