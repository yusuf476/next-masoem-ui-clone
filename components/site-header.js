import Link from "next/link";
import { getViewerContext } from "../lib/session";
import LogoutButton from "./logout-button";

const navigation = [
  { href: "/", label: "Beranda" },
  { href: "/products", label: "Katalog" },
  { href: "/dashboard", label: "Dashboard" },
];

export default async function SiteHeader() {
  const { user, cartCount } = await getViewerContext();
  const links = user?.role === "admin" ? [...navigation, { href: "/admin", label: "Admin" }] : navigation;

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="brand">
          <span className="brand-mark">MU</span>
          <span>
            <strong>Masoem Market</strong>
            <small>Campus commerce platform</small>
          </span>
        </Link>

        <nav className="site-nav" aria-label="Main navigation">
          {links.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="header-actions">
          <Link href="/cart" className="cart-pill">
            Keranjang
            <span>{cartCount}</span>
          </Link>

          {user ? (
            <div className="user-badge">
              <div>
                <strong>{user.name}</strong>
                <small>{user.email}</small>
              </div>
              <LogoutButton />
            </div>
          ) : (
            <div className="auth-actions">
              <Link href="/login" className="button button-secondary button-small">
                Masuk
              </Link>
              <Link href="/register" className="button button-primary button-small">
                Daftar
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
