"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useToast } from "./toast";

const AppViewerContext = createContext(null);
const GUEST_WISHLIST_KEY = "masoem_guest_wishlist";

function normalizeViewer(viewer) {
  const notifications = Array.isArray(viewer?.notifications)
    ? viewer.notifications
    : Array.isArray(viewer?.user?.notifications)
      ? viewer.user.notifications
      : [];
  const wishlist = Array.isArray(viewer?.wishlist)
    ? viewer.wishlist
    : Array.isArray(viewer?.user?.wishlist)
      ? viewer.user.wishlist
      : [];

  return {
    user: viewer?.user ?? null,
    cartCount: Number(viewer?.cartCount ?? 0),
    notifications,
    wishlist,
  };
}

function readGuestWishlist() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const parsed = JSON.parse(localStorage.getItem(GUEST_WISHLIST_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeGuestWishlist(items) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent("masoem:wishlist-guest"));
}

export function useAppViewer() {
  const context = useContext(AppViewerContext);

  if (!context) {
    throw new Error("useAppViewer must be used within AppViewerProvider");
  }

  return context;
}

export function AppViewerProvider({ initialViewer, children }) {
  const addToast = useToast();
  const [viewer, setViewer] = useState(() => normalizeViewer(initialViewer));

  useEffect(() => {
    setViewer(normalizeViewer(initialViewer));
  }, [initialViewer]);

  useEffect(() => {
    async function syncGuestWishlist() {
      if (!viewer.user) {
        return;
      }

      const guestItems = readGuestWishlist();

      if (guestItems.length === 0) {
        return;
      }

      try {
        const response = await fetch("/api/wishlist", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            productIds: guestItems.map((item) => item.id).filter(Boolean),
          }),
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || "Wishlist gagal disinkronkan.");
        }

        localStorage.removeItem(GUEST_WISHLIST_KEY);
        setViewer((current) => ({
          ...current,
          wishlist: payload.items ?? [],
        }));
      } catch (error) {
        addToast(error.message, "error");
      }
    }

    syncGuestWishlist();
  }, [viewer.user, addToast]);

  const unreadNotificationCount = viewer.notifications.filter((entry) => !entry.readAt).length;

  const value = useMemo(() => {
    const wishlistProductIds = new Set(
      viewer.user
        ? viewer.wishlist.map((entry) => entry.id)
        : readGuestWishlist().map((entry) => entry.id),
    );

    return {
      viewer,
      unreadNotificationCount,
      wishlistProductIds,
      async toggleWishlist(product) {
        if (!product?.id) {
          return { saved: false };
        }

        if (!viewer.user) {
          const guestItems = readGuestWishlist();
          const exists = guestItems.some((entry) => entry.id === product.id);
          const nextItems = exists
            ? guestItems.filter((entry) => entry.id !== product.id)
            : [
                {
                  id: product.id,
                  name: product.name,
                  slug: product.slug,
                  image: product.image,
                  price: product.price,
                  category: product.category,
                  addedAt: new Date().toISOString(),
                },
                ...guestItems,
              ];

          writeGuestWishlist(nextItems);
          return { saved: !exists };
        }

        const response = await fetch("/api/wishlist", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            productId: product.id,
          }),
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || "Wishlist gagal diperbarui.");
        }

        setViewer((current) => ({
          ...current,
          wishlist: payload.items ?? [],
        }));

        return payload;
      },
      async markNotificationsRead() {
        if (!viewer.user || unreadNotificationCount === 0) {
          return;
        }

        const response = await fetch("/api/notifications", {
          method: "POST",
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || "Notifikasi gagal diperbarui.");
        }

        setViewer((current) => ({
          ...current,
          notifications: payload.notifications ?? [],
        }));
      },
      readGuestWishlist,
    };
  }, [viewer, unreadNotificationCount]);

  return <AppViewerContext.Provider value={value}>{children}</AppViewerContext.Provider>;
}
