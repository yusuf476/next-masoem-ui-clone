"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function SearchModal() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  function handleSubmit(e) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/products?search=${encodeURIComponent(query.trim())}`);
      setOpen(false);
      setQuery("");
    }
  }

  function quickSearch(term) {
    router.push(`/products?search=${encodeURIComponent(term)}`);
    setOpen(false);
    setQuery("");
  }

  return (
    <>
      <button className="search-trigger" onClick={() => setOpen(true)} aria-label="Cari produk">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      </button>

      {open && (
        <div className="search-overlay" onClick={() => setOpen(false)}>
          <div className="search-modal" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSubmit} className="search-input-wrapper">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                ref={inputRef}
                type="text"
                placeholder="Cari produk, kategori, atau merek..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button type="button" className="search-close-btn" onClick={() => setOpen(false)}>
                ESC
              </button>
            </form>

            <div className="search-hints">
              <h4>Pencarian Populer</h4>
              <div className="search-hint-tags">
                {["Makanan", "Merchandise", "Alat Tulis", "Snack", "Minuman"].map((tag) => (
                  <button key={tag} className="search-hint-tag" onClick={() => quickSearch(tag)}>
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
