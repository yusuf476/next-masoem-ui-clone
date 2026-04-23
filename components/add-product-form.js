"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

const categoryOptions = [
  { value: "food", label: "Campus Dining" },
  { value: "stationery", label: "Study Essentials" },
  { value: "merchandise", label: "University Merchandise" },
  { value: "technology", label: "Tech & Gadgets" },
];

const initialFormState = {
  name: "",
  category: "food",
  price: "",
  inventory: "",
  tagline: "",
  description: "",
  features: "",
  image: "",
  featured: false,
};

export default function AddProductForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initialFormState);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error");

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function resetForm() {
    setForm(initialFormState);
    setMessage("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          price: Number(form.price),
          inventory: Number(form.inventory),
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Gagal menambahkan produk.");
      }

      setMessageType("success");
      setMessage(`Produk "${payload.product.name}" berhasil ditambahkan!`);
      resetForm();
      setForm(initialFormState);
      startTransition(() => router.refresh());
    } catch (error) {
      setMessageType("error");
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="dashboard-panel card">
      <div className="add-product-header">
        <div className="stack-sm">
          <h2>Tambah produk baru</h2>
          <p>Tambahkan produk baru ke katalog Masoem Market.</p>
        </div>
        <button
          type="button"
          className={`button ${open ? "button-ghost" : "button-primary"}`}
          onClick={() => {
            setOpen(!open);
            if (!open) setMessage("");
          }}
        >
          {open ? "Tutup form" : "➕ Tambah Produk"}
        </button>
      </div>

      {message && !open && (
        <p className={`helper-text ${messageType === "error" ? "helper-text-error" : "helper-text-success"}`}>
          {message}
        </p>
      )}

      {open && (
        <form className="add-product-form" onSubmit={handleSubmit}>
          <div className="add-product-grid">
            <div className="stack-md">
              <h3 className="add-product-section-title">📋 Informasi Dasar</h3>

              <label className="field">
                <span>Nama produk *</span>
                <input
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="Contoh: Ayam Geprek Masoem"
                  required
                />
              </label>

              <div className="form-split">
                <label className="field">
                  <span>Kategori *</span>
                  <select
                    value={form.category}
                    onChange={(e) => updateField("category", e.target.value)}
                  >
                    {categoryOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field">
                  <span>Harga (Rp) *</span>
                  <input
                    type="number"
                    min="1"
                    value={form.price}
                    onChange={(e) => updateField("price", e.target.value)}
                    placeholder="25000"
                    required
                  />
                </label>
              </div>

              <div className="form-split">
                <label className="field">
                  <span>Stok awal *</span>
                  <input
                    type="number"
                    min="0"
                    value={form.inventory}
                    onChange={(e) => updateField("inventory", e.target.value)}
                    placeholder="20"
                    required
                  />
                </label>

                <div className="field">
                  <span>Produk unggulan?</span>
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={form.featured}
                      onChange={(e) => updateField("featured", e.target.checked)}
                      className="toggle-input"
                    />
                    <span className="toggle-switch"></span>
                    <span className="toggle-text">
                      {form.featured ? "Ya, tampilkan di beranda" : "Tidak"}
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div className="stack-md">
              <h3 className="add-product-section-title">📝 Detail Produk</h3>

              <label className="field">
                <span>Tagline *</span>
                <input
                  value={form.tagline}
                  onChange={(e) => updateField("tagline", e.target.value)}
                  placeholder="Deskripsi singkat dalam satu kalimat"
                  required
                />
              </label>

              <label className="field">
                <span>Deskripsi lengkap *</span>
                <textarea
                  value={form.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  rows="4"
                  placeholder="Ceritakan keunggulan produk ini secara detail..."
                  required
                />
              </label>

              <label className="field">
                <span>Fitur unggulan (satu per baris)</span>
                <textarea
                  value={form.features}
                  onChange={(e) => updateField("features", e.target.value)}
                  rows="3"
                  placeholder={"Disajikan panas\nPorsi besar\nBumbu khas kampus"}
                />
              </label>

              <label className="field">
                <span>URL gambar produk *</span>
                <input
                  type="url"
                  value={form.image}
                  onChange={(e) => updateField("image", e.target.value)}
                  placeholder="https://example.com/gambar-produk.jpg"
                  required
                />
              </label>

              {form.image && (
                <div className="add-product-preview">
                  <img
                    src={form.image}
                    alt="Preview produk"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {message && (
            <p className={`helper-text ${messageType === "error" ? "helper-text-error" : "helper-text-success"}`}>
              {message}
            </p>
          )}

          <div className="add-product-actions">
            <button className="button button-primary" type="submit" disabled={loading}>
              {loading ? "Menyimpan produk..." : "💾 Simpan Produk Baru"}
            </button>
            <button
              type="button"
              className="button button-secondary"
              onClick={resetForm}
              disabled={loading}
            >
              Reset form
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
