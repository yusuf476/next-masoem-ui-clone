"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "./logout-button";
import ThemeToggle from "./theme-toggle";
import { AdminIcon, CartIcon, DashboardIcon, HomeIcon, PackageIcon } from "./icons";

const ProfileIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);

const iconMap = {
  admin: <AdminIcon />,
  cart: <CartIcon />,
  dashboard: <DashboardIcon />,
  home: <HomeIcon />,
  package: <PackageIcon />,
  profile: <ProfileIcon />,
};

function getMenuIcon(iconKey) {
  return iconMap[iconKey] ?? <DashboardIcon />;
}

function subscribe() {
  return () => {};
}

export default function MobileMenu({ links, user, cartCount = 0 }) {
  const [open, setOpen] = useState(false);
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const pathname = usePathname();
  const mobileLinks = [
    ...links,
    {
      href: "/cart",
      label: "Keranjang",
      iconKey: "cart",
      badge: cartCount > 0 ? cartCount : null,
    },
    user
      ? {
          href: "/profile",
          label: "Profil",
          iconKey: "profile",
        }
      : {
          href: "/login",
          label: "Masuk",
          iconKey: "profile",
        },
  ];

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const drawerContent = (
    <>
      <div
        className={`mobile-overlay ${open ? "overlay-visible" : ""}`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      <nav className={`mobile-drawer ${open ? "drawer-open" : ""}`} aria-label="Mobile navigation">
        <div className="drawer-header">
          <div className="brand">
            <img src="/logo.png" alt="Masoem Market" className="brand-logo" />
            <span>
              <strong>Masoem Market</strong>
              <small>Campus Food Market</small>
            </span>
          </div>
          <button className="drawer-close" onClick={() => setOpen(false)} aria-label="Tutup menu">
            X
          </button>
        </div>

        {user ? (
          <div className="drawer-user-card">
            <div className="drawer-user-avatar">{user.name.charAt(0).toUpperCase()}</div>
            <div>
              <strong>{user.name}</strong>
              <small>{user.email}</small>
            </div>
          </div>
        ) : null}

        <div className="drawer-nav-links">
          {mobileLinks.map((item, index) => {
            const isActive =
              pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`drawer-link ${isActive ? "drawer-link-active" : ""}`}
                onClick={() => setOpen(false)}
                style={{ transitionDelay: `${open ? index * 50 : 0}ms` }}
              >
                <span className="drawer-link-icon">{getMenuIcon(item.iconKey)}</span>
                <span className="drawer-link-label">{item.label}</span>
                {item.badge ? <span className="drawer-link-badge">{item.badge}</span> : null}
              </Link>
            );
          })}
        </div>

        <div className="drawer-footer">
          <div className="drawer-utility-row">
            <ThemeToggle compact />
          </div>
          {user ? (
            <LogoutButton />
          ) : (
            <div className="drawer-auth">
              <Link
                href="/login"
                className="drawer-auth-btn drawer-auth-secondary"
                onClick={() => setOpen(false)}
              >
                Masuk
              </Link>
              <Link
                href="/register"
                className="drawer-auth-btn drawer-auth-primary"
                onClick={() => setOpen(false)}
              >
                Daftar Akun
              </Link>
            </div>
          )}
        </div>
      </nav>
    </>
  );

  return (
    <>
      <button
        className={`hamburger-btn ${open ? "hamburger-active" : ""}`}
        onClick={() => setOpen((current) => !current)}
        aria-label={open ? "Tutup menu" : "Buka menu"}
        aria-expanded={open}
      >
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
      </button>

      {mounted ? createPortal(drawerContent, document.body) : null}
    </>
  );
}
