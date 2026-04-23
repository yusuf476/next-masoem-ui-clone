import Link from "next/link";
import ProductCard from "../components/product-card";
import PromoCarousel from "../components/promo-carousel";
import { getHomePageData } from "../lib/market";
import { getCurrentUser } from "../lib/session";
import { PackageIcon, DashboardIcon, HomeIcon } from "../components/icons";

const ExploreIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
);

const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);

const ShieldIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
);

const ZapIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
);

const DatabaseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
);

export default async function HomePage() {
  const { categories, featuredProducts, featuredStats } = await getHomePageData();
  const user = await getCurrentUser();

  return (
    <main>
      <section className="container" style={{ paddingTop: '20px' }}>
        <PromoCarousel />
      </section>

      <section className="content-section">
        <div className="container">
          <div className="section-heading" style={{ textAlign: "center", maxWidth: "600px", margin: "0 auto 48px" }}>
            <span className="badge badge-soft" style={{ margin: "0 auto" }}>Kategori</span>
            <h2>Ekosistem kampus modern</h2>
            <p>Dari makanan siap saji sampai perlengkapan presentasi kelas, semua tersedia dalam satu alur keranjang belanja.</p>
          </div>

          <div className="category-grid">
            {categories.map((category) => (
              <Link key={category.slug} href={`/products?category=${category.slug}`} className="category-card">
                <div className="stack-sm">
                  <div style={{ display: "flex", gap: "14px", alignItems: "center", marginBottom: "8px" }}>
                    <div style={{ minWidth: "48px", height: "48px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(59, 130, 246, 0.1)", borderRadius: "14px", color: "var(--primary)" }}>
                      <PackageIcon />
                    </div>
                    <h3 style={{ fontSize: "1.1rem" }}>{category.name}</h3>
                  </div>
                  <p style={{ color: "var(--muted)", lineHeight: "1.5" }}>{category.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="content-section" style={{ background: "rgba(241, 245, 249, 0.4)", padding: "80px 0" }}>
        <div className="container">
          <div className="section-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "40px" }}>
            <div className="stack-sm">
              <span className="badge badge-soft">Produk Unggulan</span>
              <h2>Pilihan favorit kampus</h2>
            </div>
            <Link href="/products" className="button button-secondary button-small">
              Lihat Semua &rarr;
            </Link>
          </div>

          <div className="product-grid">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} requiresAuth={!user} />
            ))}
          </div>
        </div>
      </section>

      <section className="content-section" style={{ padding: "80px 0 120px" }}>
        <div className="container">
          <div className="section-heading" style={{ textAlign: "center", maxWidth: "600px", margin: "0 auto 52px" }}>
            <span className="badge badge-soft" style={{ margin: "0 auto" }}>Infrastruktur</span>
            <h2>Dirancang untuk skala nyata, bukan sekadar prototipe</h2>
          </div>

          <div className="highlight-grid">
            <article className="highlight-card">
              <div style={{ marginBottom: "20px", color: "var(--primary)" }}>
                <ZapIcon />
              </div>
              <h3 style={{ marginBottom: "12px", fontSize: "1.25rem" }}>Checkout aktif</h3>
              <p style={{ color: "var(--muted)", lineHeight: 1.6 }}>Keranjang, kalkulasi checkout, ringkasan biaya, dan sistem pembuatan pesanan tersambung penuh dengan backend mutakhir.</p>
            </article>
            <article className="highlight-card">
              <div style={{ marginBottom: "20px", color: "var(--primary)" }}>
                <ShieldIcon />
              </div>
              <h3 style={{ marginBottom: "12px", fontSize: "1.25rem" }}>Keamanan Sesi</h3>
              <p style={{ color: "var(--muted)", lineHeight: 1.6 }}>Sistem register dan autentikasi berlapis yang menjamin kerahasiaan data pembelanja dengan sesi persisten.</p>
            </article>
            <article className="highlight-card">
              <div style={{ marginBottom: "20px", color: "var(--primary)" }}>
                <DatabaseIcon />
              </div>
              <h3 style={{ marginBottom: "12px", fontSize: "1.25rem" }}>Dashboard Live</h3>
              <p style={{ color: "var(--muted)", lineHeight: 1.6 }}>Riwayat pesanan, profil, dan rekomendasi produk otomatis beradaptasi berkat database real-time yang kuat.</p>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}
