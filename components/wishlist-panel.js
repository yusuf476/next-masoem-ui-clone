"use client";

import Link from "next/link";
import { formatCurrency } from "../lib/format";
import EmptyState from "./empty-state";
import WishlistButton from "./wishlist-button";
import { useAppViewer } from "./app-viewer";

export default function WishlistPanel() {
  const { viewer } = useAppViewer();
  const items = viewer.wishlist || [];

  if (items.length === 0) {
    return (
      <EmptyState 
        iconType="wishlist"
        title="Belum ada favorit"
        description="Simpan produk yang Anda incar dengan mengklik logo hati (❤️) pada produk."
      />
    );
  }

  return (
    <div className="wishlist-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px' }}>
      {items.map((product) => (
        <article key={product.id} className="product-card ripple-container" style={{ padding: '12px' }}>
          <div className="product-image-wrapper" style={{ height: '140px', marginBottom: '12px' }}>
            <Link href={`/products/${product.slug}`} className="product-image-link">
              <img src={product.image} alt={product.name} className="product-image" style={{ objectFit: 'cover' }} />
            </Link>
            <WishlistButton product={product} />
          </div>
          <div className="product-body" style={{ gap: '4px' }}>
            <span className="badge badge-soft" style={{ fontSize: '0.65rem', padding: '2px 6px', alignSelf: 'flex-start' }}>{product.category}</span>
            <Link href={`/products/${product.slug}`} className="product-title-link">
              <h3 style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>{product.name}</h3>
            </Link>
            <strong style={{ fontSize: '1rem', color: 'var(--primary)', marginTop: '4px' }}>{formatCurrency(product.price)}</strong>
          </div>
        </article>
      ))}
    </div>
  );
}
