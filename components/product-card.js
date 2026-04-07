import Link from "next/link";
import { formatCurrency } from "../lib/format";
import AddToCartButton from "./add-to-cart-button";

export default function ProductCard({ product, requiresAuth = false }) {
  const stockTone =
    product.inventory <= 0 ? "sold-out" : product.inventory <= 10 ? "running-low" : "ready";

  return (
    <article className="product-card">
      <Link href={`/products/${product.slug}`} className="product-image-link">
        <img src={product.image} alt={product.name} className="product-image" />
      </Link>

      <div className="product-body">
        <div className="product-meta">
          <span className="badge badge-soft">{product.category}</span>
          <span className="rating-pill">{product.rating} / 5</span>
        </div>

        <div className="stack-sm">
          <Link href={`/products/${product.slug}`} className="product-title-link">
            <h3>{product.name}</h3>
          </Link>
          <p>{product.tagline}</p>
          <div className="product-micro-meta">
            <small>{product.reviews} review</small>
            <span className={`stock-dot stock-dot-${stockTone}`}>
              {product.inventory <= 0
                ? "Stok habis"
                : product.inventory <= 10
                  ? `Tinggal ${product.inventory}`
                  : "Siap diproses"}
            </span>
          </div>
        </div>

        <div className="product-footer">
          <div>
            <strong>{formatCurrency(product.price)}</strong>
            <small>{product.inventory} tersisa</small>
          </div>
          <AddToCartButton
            productId={product.id}
            disabled={product.inventory <= 0}
            requiresAuth={requiresAuth}
            nextPath={`/products/${product.slug}`}
            size="small"
          />
        </div>
      </div>
    </article>
  );
}
