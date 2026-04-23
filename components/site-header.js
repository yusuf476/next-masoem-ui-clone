import Link from "next/link";
import LogoutButton from "./logout-button";
import MobileMenu from "./mobile-menu";
import SearchModal from "./search-modal";
import NotificationBell from "./notification-bell";
import ThemeToggle from "./theme-toggle";
import { CartIcon } from "./icons";

const navigation = [
  { href: "/", label: "Beranda", iconKey: "home" },
  { href: "/products", label: "Katalog", iconKey: "package" },
  { href: "/dashboard", label: "Dashboard", iconKey: "dashboard" },
];

export default function SiteHeader({ viewer }) {
  const { user, cartCount } = viewer;
  const links = user?.role === "admin"
    ? [...navigation, { href: "/admin", label: "Admin", iconKey: "admin" }]
    : navigation;

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="brand">
          <img src="/logo.png" alt="Masoem Market" className="brand-logo" />
          <span>
            <strong>Masoem Market</strong>
            <small className="brand-tagline">Campus Food Market</small>
          </span>
        </Link>

        <nav className="site-nav desktop-nav" aria-label="Main navigation">
          {links.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="header-actions desktop-actions">
          <SearchModal />
          <Link href="/cart" className="cart-pill">
            <CartIcon />
            <span>Keranjang</span>
            <span className="cart-count">{cartCount}</span>
          </Link>

          {user ? (
            <div className="user-badge">
              <div className="user-avatar">{user.name.charAt(0).toUpperCase()}</div>
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
          <NotificationBell />
          <ThemeToggle />
        </div>

        {/* Mobile-only controls */}
        <div className="mobile-header-actions">
          <SearchModal />
          <Link href="/cart" className="mobile-cart-btn" aria-label="Keranjang">
            <CartIcon />
            {cartCount > 0 && <span className="mobile-cart-badge">{cartCount}</span>}
          </Link>
          <MobileMenu links={links} user={user} cartCount={cartCount} />
        </div>
      </div>
    </header>
  );
}
