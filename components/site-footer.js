import Link from "next/link";
import LanguageSwitcher from "./language-switcher";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <div className="brand brand-static">
            <img src="/logo.png" alt="Masoem Market" className="brand-logo" />
            <span>
              <strong>Masoem Market</strong>
              <small>Built for students, lecturers, and campus life.</small>
            </span>
          </div>
          <p>
            A modern marketplace for meals, university merchandise, study essentials, and digital
            campus convenience in one web experience.
          </p>
        </div>

        <div>
          <h3>Explore</h3>
          <Link href="/">Beranda</Link>
          <Link href="/products">Katalog Produk</Link>
          <Link href="/cart">Keranjang</Link>
        </div>

        <div>
          <h3>Account</h3>
          <Link href="/login">Masuk</Link>
          <Link href="/register">Daftar</Link>
          <Link href="/dashboard">Dashboard</Link>
        </div>

        <div>
          <h3>Campus Info</h3>
          <p>Jl. Raya Cipacing No. 22, Bandung</p>
          <p>support@masoem.market</p>
          <p>Every day, 08.00 - 21.00 WIB</p>
        </div>
      </div>

      <div className="container footer-bottom">
        <small>&copy; {new Date().getFullYear()} Masoem Market. All rights reserved.</small>
        <LanguageSwitcher />
      </div>
    </footer>
  );
}
