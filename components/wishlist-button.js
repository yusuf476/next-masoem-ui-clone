"use client";

import { useEffect, useState } from "react";
import { useToast } from "./toast";
import { useAppViewer } from "./app-viewer";

export default function WishlistButton({ product }) {
  const [guestWishlistTick, setGuestWishlistTick] = useState(0);
  const addToast = useToast();
  const { viewer, wishlistProductIds, toggleWishlist, readGuestWishlist } = useAppViewer();

  useEffect(() => {
    if (viewer.user || !product) {
      return undefined;
    }

    function handleGuestWishlistChange() {
      setGuestWishlistTick((current) => current + 1);
    }

    window.addEventListener("masoem:wishlist-guest", handleGuestWishlistChange);
    return () => window.removeEventListener("masoem:wishlist-guest", handleGuestWishlistChange);
  }, [product, viewer.user]);

  const active = Boolean(
    product &&
      (viewer.user
        ? wishlistProductIds.has(product.id)
        : readGuestWishlist().some((item) => item.id === product.id && guestWishlistTick >= 0)),
  );

  const handleToggleWishlist = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!product) {
      return;
    }

    try {
      const result = await toggleWishlist(product);

      if (window.triggerHaptic) {
        window.triggerHaptic();
      }

      addToast(
        result.saved ? "Produk disimpan ke wishlist." : "Produk dihapus dari wishlist.",
        "success",
        2200,
      );
    } catch (error) {
      addToast(error.message, "error");
    }
  };

  return (
    <button
      className={`wishlist-btn ${active ? "active" : ""}`}
      onClick={handleToggleWishlist}
      aria-label={active ? "Hapus dari favorit" : "Tambah ke favorit"}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    </button>
  );
}
