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
        <section className="section-heading">
          <span className="badge badge-strong">Catalog</span>
          <h1>Katalog produk Masoem Market</h1>
          <p>Telusuri makanan, perlengkapan belajar, merchandise resmi, dan perangkat pendukung produktivitas.</p>
        </section>

        <section className="card" style={{ padding: 24 }}>
          <form className="catalog-filters" method="get">
            <label className="field">
              <span>Cari produk</span>
              <input name="search" defaultValue={search} placeholder="Cari nama produk atau kategori..." />
            </label>
            <label className="field">
              <span>Kategori</span>
              <select name="category" defaultValue={category}>
                <option value="all">Semua kategori</option>
                {categories.map((item) => (
                  <option key={item.slug} value={item.slug}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Urutkan</span>
              <select name="sort" defaultValue={sort}>
                <option value="featured">Paling direkomendasikan</option>
                <option value="rating">Rating tertinggi</option>
                <option value="price-low">Harga terendah</option>
                <option value="price-high">Harga tertinggi</option>
                <option value="name">Nama A-Z</option>
              </select>
            </label>
            <button className="button button-primary" type="submit">
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
