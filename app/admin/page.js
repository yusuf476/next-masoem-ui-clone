import { redirect } from "next/navigation";
import AddProductForm from "../../components/add-product-form";
import { AdminOrderControls, AdminProductControls } from "../../components/admin-controls";
import AdminTabs from "../../components/admin-tabs";
import { formatCurrency, formatDate } from "../../lib/format";
import { getAdminDashboardData, isUserAdmin } from "../../lib/market";
import { getCurrentUser } from "../../lib/session";

function PaymentStatusPill({ value }) {
  const tone =
    value === "paid"
      ? "success"
      : value === "pending" || value === "awaiting_payment"
        ? "warning"
        : value === "failed" || value === "expired"
          ? "danger"
          : "neutral";

  return <span className={`status-pill status-pill-${tone}`}>{value.replaceAll("_", " ")}</span>;
}

export default async function AdminPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/admin");
  }

  if (!isUserAdmin(user)) {
    redirect("/dashboard");
  }

  const admin = await getAdminDashboardData();

  const overviewTab = (
    <>
      <section className="admin-banner card" style={{ padding: '24px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, rgba(30,58,138,0.1), rgba(16,185,129,0.1))', border: '1px solid var(--primary)' }}>
        <div className="stack-sm" style={{ flex: 1 }}>
          <strong style={{ fontSize: '1.2rem', color: 'var(--primary)' }}>Sistem Aktif ({admin.dataSource})</strong>
          <p style={{ margin: 0 }}>
            Semua modul berjalan normal. {admin.dataSource === "Supabase PostgreSQL" ? "Data live tersinkronisasi." : "Berjalan di local fallback mode."}
          </p>
        </div>
        <span className="badge badge-strong" style={{ padding: '8px 16px', background: 'var(--primary)' }}>Status: Sehat</span>
      </section>

      <section className="admin-grid">
        {admin.stats.map((stat, i) => (
          <article key={stat.label} className="admin-stat-card">
            <div className="admin-stat-icon">
              {i === 0 ? "💰" : i === 1 ? "📦" : i === 2 ? "👥" : "🛒"}
            </div>
            <div className="admin-stat-content">
              <h3>{typeof stat.value === "number" ? formatCurrency(stat.value) : stat.value}</h3>
              <p>{stat.label}</p>
            </div>
          </article>
        ))}
      </section>

      <div className="admin-grid-layout">
        {/* Sales Chart Mockup */}
        <section className="admin-chart-container">
          <div style={{ position: 'absolute', top: '24px', left: '24px' }}>
            <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Grafik Penjualan 7 Hari</h2>
            <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.9rem' }}>Tren transaksi harian</p>
          </div>
          <div className="chart-bars">
            {admin.salesTrend.map((point) => {
              const highestRevenue = Math.max(...admin.salesTrend.map((entry) => entry.revenue), 1);
              const height = Math.max(12, Math.round((point.revenue / highestRevenue) * 100));

              return (
                <div key={point.key} className="chart-bar-wrapper">
                  <div className="chart-bar" style={{ height: `${height}%` }}></div>
                  <span className="chart-label">{point.label}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Low Stock Watchlist */}
        <section className="dashboard-panel card" style={{ height: '100%', overflow: 'hidden' }}>
          <div className="stack-sm" style={{ marginBottom: '16px' }}>
            <h2 style={{ margin: 0 }}>Stok Menipis</h2>
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem' }}>Aturan restock: ≤ 10 unit</p>
          </div>
          {admin.lowStockProducts.length === 0 ? (
            <div style={{ height: '200px', display: 'grid', placeItems: 'center', textAlign: 'center', color: 'var(--muted)' }}>
              <div>
                <span style={{ fontSize: '2rem', display: 'block', marginBottom: '8px' }}>✅</span>
                Semua stok produk tersedia aman.
              </div>
            </div>
          ) : (
            <div className="stack-sm" style={{ height: '300px', overflowY: 'auto' }}>
              {admin.lowStockProducts.map((product) => (
                <article key={product.id} className="inventory-card" style={{ background: 'var(--bg)' }}>
                  <div>
                    <strong>{product.name}</strong>
                    <p>{product.category}</p>
                  </div>
                  <span className="inventory-badge" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>{product.inventory} sisa</span>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="dashboard-panel card" style={{ marginTop: '32px' }}>
        <div className="stack-sm" style={{ marginBottom: '24px' }}>
          <h2 style={{ margin: 0 }}>Pesanan Masuk Terbaru</h2>
          <p style={{ margin: 0, color: 'var(--muted)' }}>10 transaksi terakhir yang perlu ditindaklanjuti.</p>
        </div>

        {admin.recentOrders.length === 0 ? (
          <div className="order-card" style={{ textAlign: 'center', padding: '40px 20px' }}>
            <span style={{ fontSize: '2rem', display: 'block', marginBottom: '8px' }}>🧾</span>
            <h3>Belum ada transaksi terekam</h3>
          </div>
        ) : (
          <div className="admin-glass-table-wrapper">
            <table className="admin-glass-table">
              <thead>
                <tr>
                  <th>Order ID / Waktu</th>
                  <th>Pelanggan</th>
                  <th>Status Pembayaran</th>
                  <th>Total Tagihan</th>
                </tr>
              </thead>
              <tbody>
                {admin.recentOrders.slice(0, 10).map((order) => (
                  <tr key={order.id}>
                    <td>
                      <strong style={{ color: 'var(--primary)' }}>{order.orderNumber}</strong>
                      <small style={{ display: 'block', color: 'var(--muted)' }}>{formatDate(order.createdAt)}</small>
                    </td>
                    <td>
                      <strong>{order.shipping.fullName}</strong>
                      <small style={{ display: 'block', color: 'var(--muted)' }}>{order.fulfillmentMethod}</small>
                    </td>
                    <td>
                      <PaymentStatusPill value={order.paymentStatus} />
                      <small style={{ display: 'block', color: 'var(--muted)', marginTop: '4px' }}>{order.paymentMethod}</small>
                    </td>
                    <td>
                      <strong>{formatCurrency(order.total)}</strong>
                      <small style={{ display: 'block', color: 'var(--muted)' }}>{order.items.length} item</small>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="admin-grid" style={{ marginTop: '24px' }}>
        <article className="dashboard-panel card" style={{ padding: '24px' }}>
          <h2 style={{ marginBottom: '16px' }}>Top Produk</h2>
          <div className="stack-sm">
            {admin.topProducts.length === 0 ? (
              <p>Belum ada produk yang terjual.</p>
            ) : (
              admin.topProducts.map((product) => (
                <div key={product.productId} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                  <div>
                    <strong>{product.name}</strong>
                    <p style={{ fontSize: '0.85rem' }}>{product.category} • {product.quantity} item</p>
                  </div>
                  <strong>{formatCurrency(product.revenue)}</strong>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="dashboard-panel card" style={{ padding: '24px' }}>
          <h2 style={{ marginBottom: '16px' }}>Kategori Terlaris</h2>
          <div className="stack-sm">
            {admin.categoryPerformance.length === 0 ? (
              <p>Belum ada kategori dengan transaksi.</p>
            ) : (
              admin.categoryPerformance.map((category) => (
                <div key={category.category} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                  <div>
                    <strong>{category.category}</strong>
                    <p style={{ fontSize: '0.85rem' }}>{category.quantity} item terjual</p>
                  </div>
                  <strong>{formatCurrency(category.revenue)}</strong>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="dashboard-panel card" style={{ padding: '24px' }}>
          <h2 style={{ marginBottom: '16px' }}>Metode Pembayaran</h2>
          <div className="stack-sm">
            {admin.paymentMethods.map((item) => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                <strong>{item.label}</strong>
                <span>{item.value} transaksi</span>
              </div>
            ))}
          </div>
        </article>

        <article className="dashboard-panel card" style={{ padding: '24px' }}>
          <h2 style={{ marginBottom: '16px' }}>Distribusi Status</h2>
          <div className="stack-sm">
            {admin.statusDistribution.map((item) => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                <strong>{item.label}</strong>
                <span>{item.value} order</span>
              </div>
            ))}
          </div>
        </article>
      </section>
    </>
  );

  const ordersTab = (
    <div className="stack-lg">
      <AdminOrderControls recentOrders={admin.recentOrders} />
    </div>
  );

  const productsTab = (
    <div className="stack-lg">
      <AddProductForm />
      <AdminProductControls inventoryProducts={admin.inventoryProducts} />
    </div>
  );

  return (
    <main className="container content-section stack-md">
      <section className="section-heading">
        <span className="badge badge-strong">Admin Control</span>
        <h1>Kendalikan Operasional Toko</h1>
        <p>Pantau status toko, tangani pesanan, dan operasikan katalog dari satu panel dinamis.</p>
      </section>

      <AdminTabs
        overviewTab={overviewTab}
        ordersTab={ordersTab}
        productsTab={productsTab}
      />
    </main>
  );
}
