"use client";

import { startTransition, useDeferredValue, useState } from "react";
import { useRouter } from "next/navigation";

const orderStatuses = [
  "Awaiting Payment",
  "Payment Expired",
  "Payment Failed",
  "Paid & Confirmed",
  "Preparing",
  "Ready for Pickup",
  "Out for Delivery",
  "Completed",
  "Cancelled",
];

function InlineMessage({ value, tone = "neutral" }) {
  if (!value) {
    return null;
  }

  return (
    <p
      className={`helper-text ${
        tone === "error" ? "helper-text-error" : tone === "success" ? "helper-text-success" : ""
      }`}
    >
      {value}
    </p>
  );
}

function OrderStatusControl({ orderNumber, currentStatus }) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`/api/admin/orders/${orderNumber}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Gagal menyimpan status.");
      }

      setStatus(payload.order.status);
      setMessage("Status order diperbarui.");
      startTransition(() => router.refresh());
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  const isDirty = status !== currentStatus;

  return (
    <form className="admin-inline-form" onSubmit={handleSubmit}>
      <select value={status} onChange={(event) => setStatus(event.target.value)} disabled={loading}>
        {orderStatuses.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <button
        className="button button-secondary button-small"
        type="submit"
        disabled={loading || !isDirty}
      >
        {loading ? "Menyimpan..." : "Update"}
      </button>
      <InlineMessage
        value={message}
        tone={message.toLowerCase().includes("gagal") ? "error" : "success"}
      />
    </form>
  );
}

function InventoryControl({ productId, initialInventory }) {
  const router = useRouter();
  const [inventory, setInventory] = useState(String(initialInventory));
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inventory: Number(inventory) }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Gagal menyimpan stok.");
      }

      setInventory(String(payload.product.inventory));
      setMessage("Stok disimpan.");
      startTransition(() => router.refresh());
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  const isDirty = Number(inventory) !== initialInventory;

  return (
    <form className="admin-inline-form" onSubmit={handleSubmit}>
      <input
        type="number"
        min="0"
        value={inventory}
        onChange={(event) => setInventory(event.target.value)}
        disabled={loading}
      />
      <button
        className="button button-secondary button-small"
        type="submit"
        disabled={loading || !isDirty}
      >
        {loading ? "Menyimpan..." : "Simpan"}
      </button>
      <InlineMessage
        value={message}
        tone={message.toLowerCase().includes("gagal") ? "error" : "success"}
      />
    </form>
  );
}

export function AdminOrderControls({ recentOrders }) {
  const [orderQuery, setOrderQuery] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const deferredOrderQuery = useDeferredValue(orderQuery);

  const normalizedOrderQuery = deferredOrderQuery.trim().toLowerCase();
  const filteredOrders = recentOrders.filter((order) => {
    const matchesQuery =
      !normalizedOrderQuery ||
      [order.orderNumber, order.shipping.fullName, order.status, order.paymentStatus]
        .join(" ")
        .toLowerCase()
        .includes(normalizedOrderQuery);
    const matchesStatus = orderStatusFilter === "all" || order.status === orderStatusFilter;

    return matchesQuery && matchesStatus;
  });

  return (
    <div className="dashboard-panel card">
      <div className="stack-sm">
        <h2>Kelola status order</h2>
        <p>Ubah progres pesanan secara efisien.</p>
      </div>
      <div className="admin-toolbar-grid">
        <label className="field">
          <span>Cari order atau pelanggan</span>
          <input
            value={orderQuery}
            onChange={(event) => setOrderQuery(event.target.value)}
            placeholder="MU-123456 atau nama pelanggan"
          />
        </label>
        <label className="field">
          <span>Filter status</span>
          <select
            value={orderStatusFilter}
            onChange={(event) => setOrderStatusFilter(event.target.value)}
          >
            <option value="all">Semua status</option>
            {orderStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="admin-meta-row">
        <span className="badge badge-soft">{filteredOrders.length} order tampil</span>
        {(orderQuery || orderStatusFilter !== "all") && (
          <button
            type="button"
            className="button button-ghost button-small"
            onClick={() => {
              setOrderQuery("");
              setOrderStatusFilter("all");
            }}
          >
            Reset filter
          </button>
        )}
      </div>
      <div className="table-scroll">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Status saat ini</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan="3">
                  <div className="admin-empty-row">
                    <strong>Tidak ada order yang cocok</strong>
                    <small>Ubah kata kunci atau filter status untuk melihat data lain.</small>
                  </div>
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <strong>{order.orderNumber}</strong>
                    <small>{order.shipping.fullName}</small>
                  </td>
                  <td>
                    <strong>{order.status}</strong>
                    <small>{order.paymentStatus}</small>
                  </td>
                  <td>
                    <OrderStatusControl orderNumber={order.orderNumber} currentStatus={order.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminProductControls({ inventoryProducts }) {
  const [productQuery, setProductQuery] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const deferredProductQuery = useDeferredValue(productQuery);

  const normalizedProductQuery = deferredProductQuery.trim().toLowerCase();
  
  const filteredProducts = inventoryProducts.filter((product) => {
    const matchesQuery =
      !normalizedProductQuery ||
      [product.id, product.name, product.category]
        .join(" ")
        .toLowerCase()
        .includes(normalizedProductQuery);
    const matchesStock =
      stockFilter === "all" ||
      (stockFilter === "critical" && product.inventory <= 10) ||
      (stockFilter === "healthy" && product.inventory > 10) ||
      (stockFilter === "out" && product.inventory === 0);

    return matchesQuery && matchesStock;
  });

  return (
    <div className="dashboard-panel card">
      <div className="stack-sm">
        <h2>Kelola stok aktual produk</h2>
        <p>Perbarui inventory produk secara langsung untuk menghindari overselling.</p>
      </div>
      <div className="admin-toolbar-grid">
        <label className="field">
          <span>Cari produk</span>
          <input
            value={productQuery}
            onChange={(event) => setProductQuery(event.target.value)}
            placeholder="Nama, ID, atau kategori"
          />
        </label>
        <label className="field">
          <span>Filter stok</span>
          <select value={stockFilter} onChange={(event) => setStockFilter(event.target.value)}>
            <option value="all">Semua produk</option>
            <option value="critical">Stok kritis (≤ 10)</option>
            <option value="healthy">Stok aman (&gt; 10)</option>
            <option value="out">Stok habis</option>
          </select>
        </label>
      </div>
      <div className="admin-meta-row">
        <span className="badge badge-soft">{filteredProducts.length} produk tampil</span>
        {(productQuery || stockFilter !== "all") && (
          <button
            type="button"
            className="button button-ghost button-small"
            onClick={() => {
              setProductQuery("");
              setStockFilter("all");
            }}
          >
            Reset filter
          </button>
        )}
      </div>
      <div className="table-scroll">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Produk</th>
              <th>Kategori</th>
              <th>Stok</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan="3">
                  <div className="admin-empty-row">
                    <strong>Tidak ada produk yang cocok</strong>
                    <small>Coba ubah kata kunci pencarian atau filter stok.</small>
                  </div>
                </td>
              </tr>
            ) : (
              filteredProducts.map((product) => (
                <tr key={product.id}>
                  <td>
                    <strong>{product.name}</strong>
                    <small>{product.id}</small>
                  </td>
                  <td>
                    <strong>{product.category}</strong>
                    <small>{product.featured ? "Featured" : "Regular"}</small>
                  </td>
                  <td>
                    <InventoryControl productId={product.id} initialInventory={product.inventory} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
