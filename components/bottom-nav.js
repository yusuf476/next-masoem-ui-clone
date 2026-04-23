"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminIcon, CartIcon, DashboardIcon, HomeIcon, PackageIcon } from "./icons";

const ProfileIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);

export default function BottomNav({ viewer }) {
  const pathname = usePathname();
  const user = viewer?.user ?? null;
  const cartCount = viewer?.cartCount ?? 0;

  const navItems = user?.role === "admin"
    ? [
        { href: "/", label: "Beranda", icon: <HomeIcon /> },
        { href: "/products", label: "Katalog", icon: <PackageIcon /> },
        { href: "/cart", label: "Keranjang", icon: <CartIcon />, badge: cartCount, featured: true },
        { href: "/admin", label: "Admin", icon: <AdminIcon /> },
        {
          href: "/profile",
          label: "Profil",
          icon: <span className="bottom-nav-avatar">{user.name.charAt(0).toUpperCase()}</span>,
        },
      ]
    : [
        { href: "/", label: "Beranda", icon: <HomeIcon /> },
        { href: "/products", label: "Katalog", icon: <PackageIcon /> },
        { href: "/cart", label: "Keranjang", icon: <CartIcon />, badge: cartCount, featured: true },
        { href: user ? "/dashboard" : "/login", label: user ? "Pesanan" : "Masuk", icon: <DashboardIcon /> },
        {
          href: "/profile",
          label: "Profil",
          icon: user ? <span className="bottom-nav-avatar">{user.name.charAt(0).toUpperCase()}</span> : <ProfileIcon />,
        },
      ];

  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-shell container">
        <div className="bottom-nav-inner">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link 
              key={item.href} 
              href={item.href} 
              className={`bottom-nav-item ${isActive ? "active" : ""} ${item.featured ? "bottom-nav-item-featured" : ""}`}
            >
              <div className="bottom-nav-icon-wrap">
                {item.icon}
                {item.badge > 0 && <span className="bottom-nav-badge">{item.badge}</span>}
              </div>
              <span>{item.label}</span>
            </Link>
          );
        })}
        </div>
      </div>
    </nav>
  );
}
