"use client";

import { useState } from "react";
import AddToCartButton from "./add-to-cart-button";

export default function ProductPurchasePanel({ product, requiresAuth = false }) {
  const [quantity, setQuantity] = useState(1);
  const maxQuantity = Math.max(1, Math.min(product.inventory, 10));

  return (
    <div className="product-purchase-panel">
      <div className="quantity-card">
        <div className="stack-xs">
          <strong>Pilih jumlah</strong>
          <p>Atur kuantitas sebelum menambahkan ke keranjang.</p>
        </div>
        <div className="quantity-stepper">
          <button
            type="button"
            className="button button-secondary button-small"
            onClick={() => setQuantity((current) => Math.max(1, current - 1))}
            disabled={quantity <= 1}
          >
            -
          </button>
          <span>{quantity}</span>
          <button
            type="button"
            className="button button-secondary button-small"
            onClick={() => setQuantity((current) => Math.min(maxQuantity, current + 1))}
            disabled={quantity >= maxQuantity}
          >
            +
          </button>
        </div>
      </div>

      <AddToCartButton
        productId={product.id}
        quantity={quantity}
        disabled={product.inventory <= 0}
        requiresAuth={requiresAuth}
        nextPath={`/products/${product.slug}`}
      />
    </div>
  );
}
