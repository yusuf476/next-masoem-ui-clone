import Link from "next/link";
import ProductCard from "../components/product-card";
import { getHomePageData } from "../lib/market";
import { getCurrentUser } from "../lib/session";

export default async function HomePage() {
  const { categories, featuredProducts, featuredStats } = await getHomePageData();
  const user = await getCurrentUser();

  return (
    <main>
      <section className="hero">
        <div className="container hero-panel">
          <div className="stack-md">
            <span className="badge badge-strong">Unified Campus Commerce</span>
            <h1 className="hero-title">Belanja kebutuhan kampus dalam satu pengalaman web yang rapi.</h1>
            <p>
              Masoem Market memadukan kuliner, merchandise, perlengkapan belajar, dan gadget kampus
              dalam platform yang cepat, modern, dan mudah dipakai dari desktop maupun mobile.
            </p>

            <div className="hero-actions">
              <Link href="/products" className="button button-primary">
                Lihat katalog
              </Link>
              <Link href={user ? "/dashboard" : "/register"} className="button button-secondary">
                {user ? "Buka dashboard" : "Buat akun"}
              </Link>
            </div>

            <div className="stats-grid">
              {featuredStats.map((stat) => (
                <div key={stat.label} className="stat-card">
                  <strong>{stat.value}</strong>
                  <p>{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="hero-visual">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCY1sXdNpCGgMYWTHj0o48WKL6c1nO3vf-oOxe7DMMdg5BPLXi9pIEiahgufMT6jUCFLl03D-FjY6g9eSZEoVIrtVVxrv78JhUg895U8PEzTRqXSiqY14IX7NkQ9E4_8Ee-ZO_CQOjxysWqvJtsJtdW5oBFqTApY6dK_PrUru6YtorKlljOZLlZyp4hSTUagMwVMk5-YI9ppNv5nlEemjLZLWHImj0G_4fTMdofsOpSawkc6iERRe1_uvoB8Mj93ilAXLJokOTcibQu"
              alt="Masoem Market visual"
            />
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBrAvoMJMC_2NOTTo6VPXgMaZ-ArdlxRdV6lAczIXaBvtnCA5nrv79OqahgIsvKVEUv5Phb-zSlPte3pA95KPNCwqClQD5C7xclRfiXDn4JDCpKXyuDAMrGJ41bdlzI80ySBRYINIeH-4KnX4YvsM6W1ItmMoYmHLpwsfzJiC3sHcnDi7BvTKTeqa3PgYKyLkhDydWgo9mrV80wyAtgT8547T_26x-jxcDr6klW1wyK_j3YszxwuYC8LZ3KDvIzAUJsWixZlg9vN60b"
              alt="Campus product preview"
            />
          </div>
        </div>
      </section>

      <section className="content-section">
        <div className="container">
          <div className="section-heading">
            <span className="badge badge-soft">Categories</span>
            <h2>Kategori unggulan untuk ritme kampus modern</h2>
            <p>Dari makanan siap santap sampai perlengkapan presentasi, semua ada dalam satu alur belanja.</p>
          </div>

          <div className="category-grid">
            {categories.map((category) => (
              <Link key={category.slug} href={`/products?category=${category.slug}`} className="category-card">
                <div className="stack-sm">
                  <span className="badge badge-soft">{category.name}</span>
                  <h3>{category.name}</h3>
                  <p>{category.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="content-section">
        <div className="container">
          <div className="section-heading">
            <span className="badge badge-soft">Featured Products</span>
            <h2>Produk pilihan dengan performa terbaik</h2>
            <p>Dipilih dari item paling sering dibeli dan paling disukai oleh komunitas kampus.</p>
          </div>

          <div className="product-grid">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} requiresAuth={!user} />
            ))}
          </div>
        </div>
      </section>

      <section className="content-section">
        <div className="container">
          <div className="section-heading">
            <span className="badge badge-soft">Why It Works</span>
            <h2>Dirancang seperti produk kampus sungguhan, bukan sekadar halaman presentasi</h2>
          </div>

          <div className="highlight-grid">
            <article className="highlight-card">
              <h3>Checkout aktif</h3>
              <p>Keranjang, checkout, ringkasan biaya, dan pembuatan pesanan tersambung penuh dengan backend.</p>
            </article>
            <article className="highlight-card">
              <h3>Akun & sesi pengguna</h3>
              <p>Mahasiswa dapat register, login, logout, dan menyimpan progres belanja dengan sesi yang persisten.</p>
            </article>
            <article className="highlight-card">
              <h3>Dashboard real-time</h3>
              <p>Riwayat pesanan, ringkasan akun, dan rekomendasi produk otomatis berubah sesuai aktivitas pengguna.</p>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}
