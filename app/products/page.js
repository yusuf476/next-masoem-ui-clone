import Link from "next/link";
import ProductCard from "../../components/product-card";
import { getCatalog } from "../../lib/market";
import { getCurrentUser } from "../../lib/session";

export default async function ProductsPage({ searchParams }) {
  const params = await searchParams;
  const search = params.search ?? "";
  const category = params.category ?? "all";
  const sort = params.sort ?? "featured";
  const { categories, products } = await getCatalog({ search, category, sort });
  const user = await getCurrentUser();
  const activeCategory = categories.find((item) => item.slug === category);
  const highlightedProducts = products.slice(0, 3);

  return (
    <main className="catalog-shell">
      <div className="container stack-lg">
        <section className="section-heading" style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
          <span className="badge badge-strong" style={{ margin: '0 auto' }}>Eksplorasi</span>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)' }}>Katalog Produk</h1>
          <p>Temukan kuliner, perlengkapan belajar, dan merchandise resmi untuk mendukung produktivitasmu.</p>
        </section>

        <section className="card" style={{ padding: 16, position: 'sticky', top: '80px', zIndex: 30, background: 'var(--surface)', backdropFilter: 'blur(16px)', border: '1px solid var(--border)' }}>
          <form className="catalog-filters" method="get" style={{ alignItems: 'end' }}>
            <label className="field" style={{ gap: '6px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Cari produk</span>
              <input name="search" defaultValue={search} placeholder="Nama atau kategori..." style={{ border: 'none', background: 'var(--bg)', padding: '12px 16px' }} />
            </label>
            <label className="field" style={{ gap: '6px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Kategori</span>
              <select name="category" defaultValue={category} style={{ border: 'none', background: 'var(--bg)', padding: '12px 16px' }}>
                <option value="all">Semua Kategori</option>
                {categories.map((item) => (
                  <option key={item.slug} value={item.slug}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field" style={{ gap: '6px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Urutkan</span>
              <select name="sort" defaultValue={sort} style={{ border: 'none', background: 'var(--bg)', padding: '12px 16px' }}>
                <option value="featured">Rekomendasi</option>
                <option value="rating">Rating tertinggi</option>
                <option value="price-low">Harga terendah</option>
                <option value="price-high">Harga tertinggi</option>
                <option value="name">Nama A-Z</option>
              </select>
            </label>
            <button className="button button-primary" type="submit" style={{ height: '44px' }}>
              Terapkan
            </button>
          </form>
        </section>

        <section className="catalog-highlights">
          <article className="card catalog-intro-card">
            <span className="badge badge-soft">{activeCategory?.name ?? "Semua kategori"}</span>
            <h2>{activeCategory ? activeCategory.description : "Temukan produk yang paling cocok untuk ritme kuliah Anda."}</h2>
            <p>
              Gunakan kombinasi pencarian, kategori, dan sorting untuk menemukan makanan cepat,
              merchandise kampus, sampai gadget pendukung produktivitas.
            </p>
            <div className="chip-row">
              <Link href="/products?category=food" className="filter-chip">
                Makanan favorit
              </Link>
              <Link href="/products?category=stationery" className="filter-chip">
                Perlengkapan belajar
              </Link>
              <Link href="/products?sort=rating" className="filter-chip">
                Rating tertinggi
              </Link>
            </div>
          </article>

          <article className="card catalog-insight-card">
            <span className="badge badge-strong">Pilihan cepat</span>
            <div className="stack-sm">
              {highlightedProducts.map((product) => (
                <Link key={product.id} href={`/products/${product.slug}`} className="quick-pick">
                  <div>
                    <strong>{product.name}</strong>
                    <p>{product.category}</p>
                  </div>
                  <span>{product.rating} / 5</span>
                </Link>
              ))}
            </div>
          </article>
        </section>

        <section className="catalog-toolbar">
          <div className="stack-xs">
            <h2>{products.length} produk ditemukan</h2>
            <p>Gunakan pencarian dan filter kategori untuk mempersempit hasil.</p>
          </div>
          <Link href="/cart" className="button button-secondary">
            Lihat keranjang
          </Link>
        </section>

        {products.length === 0 ? (
          <section className="card empty-state stack-md">
            <h2>Belum ada produk yang cocok</h2>
            <p>Coba ganti kata kunci, kategori, atau urutan hasil untuk melihat produk lain.</p>
            <div className="hero-actions">
              <Link href="/products" className="button button-primary">
                Reset pencarian
              </Link>
              <Link href="/cart" className="button button-secondary">
                Buka keranjang
              </Link>
            </div>
          </section>
        ) : (
          <section className="product-grid">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} requiresAuth={!user} />
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
