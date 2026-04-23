import { notFound } from "next/navigation";
import ProductCard from "../../../components/product-card";
import ProductPurchasePanel from "../../../components/product-purchase-panel";
import Breadcrumb from "../../../components/breadcrumb";
import ReviewsPanel from "../../../components/reviews-panel";
import WishlistButton from "../../../components/wishlist-button";
import { formatCurrency } from "../../../lib/format";
import { getProductBySlug, getRelatedProducts } from "../../../lib/market";
import { getCurrentUser } from "../../../lib/session";

export default async function ProductDetailPage({ params }) {
  const resolvedParams = await params;
  const product = await getProductBySlug(resolvedParams.slug);

  if (!product) {
    notFound();
  }

  const relatedProducts = await getRelatedProducts(resolvedParams.slug);
  const user = await getCurrentUser();
  const stockTone =
    product.inventory <= 0 ? "stock-dot-sold-out" : product.inventory <= 10 ? "stock-dot-running-low" : "stock-dot-ready";
  const stockLabel =
    product.inventory <= 0
      ? "Stok habis"
      : product.inventory <= 10
        ? `Stok terbatas: ${product.inventory}`
        : `${product.inventory} siap diproses`;

  return (
    <main className="container">
      <Breadcrumb items={[
        { href: "/", label: "Beranda" },
        { href: "/products", label: "Katalog" },
        { label: product.name },
      ]} />
      <section className="detail-layout">
        <div className="detail-visual card">
          <img src={product.image} alt={product.name} />
        </div>

        <div className="detail-content card stack-md">
          <div className="product-detail-topline" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-soft">{product.category}</span>
              <span className={`stock-dot ${stockTone}`}>{stockLabel}</span>
            </div>
            <div style={{ position: 'relative', width: '40px', height: '40px', display: 'grid', placeItems: 'center', background: 'var(--surface-strong)', borderRadius: '50%' }}>
              <WishlistButton product={product} />
            </div>
          </div>
          <div className="stack-sm">
            <h1>{product.name}</h1>
            <p className="product-detail-tagline">{product.tagline}</p>
            <p>{product.description}</p>
          </div>

          <div className="summary-row">
            <span className="detail-price">{formatCurrency(product.price)}</span>
            <span className="rating-pill">
              {product.rating} / 5 | {product.reviews} review
            </span>
          </div>

          <div className="detail-feature-grid">
            <article className="detail-feature-card">
              <strong>Siap kampus</strong>
              <p>Cocok untuk ritme kuliah, organisasi, dan aktivitas harian di kampus.</p>
            </article>
            <article className="detail-feature-card">
              <strong>Estimasi cepat</strong>
              <p>Pesanan diproses cepat dengan alur checkout yang sudah aktif.</p>
            </article>
            <article className="detail-feature-card">
              <strong>Belanja aman</strong>
              <p>Simpan keranjang, pantau order, dan kelola pembelian dari dashboard akun.</p>
            </article>
          </div>

          <div className="card detail-feature-panel">
            <div className="stack-sm">
              <h3>Keunggulan produk</h3>
              <ul className="feature-list">
                {product.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="summary-row">
            <div className="stack-xs">
              <strong>Stok tersedia</strong>
              <p>{product.inventory <= 0 ? "Produk sedang habis. Cek lagi sebentar ya." : `${product.inventory} item siap diproses.`}</p>
            </div>
          </div>

          <ProductPurchasePanel product={product} requiresAuth={!user} />
          
          <ReviewsPanel requiresAuth={!user} />
        </div>
      </section>

      <section className="content-section">
        <div className="section-heading">
          <span className="badge badge-soft">Related</span>
          <h2>Produk lain yang relevan</h2>
        </div>

        <div className="product-grid">
          {relatedProducts.map((entry) => (
            <ProductCard key={entry.id} product={entry} requiresAuth={!user} />
          ))}
        </div>
      </section>
    </main>
  );
}

