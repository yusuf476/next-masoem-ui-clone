import { redirect } from "next/navigation";
import AdminControls from "../../components/admin-controls";
import { formatCurrency, formatDate } from "../../lib/format";
import { getAdminDashboardData, isUserAdmin } from "../../lib/market";
import { getCurrentUser } from "../../lib/session";

function PaymentStatusPill({ value }) {
  const tone = value === "paid" ? "success" : value === "awaiting_payment" ? "warning" : "neutral";

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

  return (
    <main className="container content-section stack-lg">
      <section className="section-heading">
        <span className="badge badge-strong">Admin Control</span>
        <h1>Panel operasional Masoem Market</h1>
        <p>
          Pantau database aktif, omzet, stok rawan habis, pelanggan terbaru, dan status pembayaran dari
          satu halaman.
        </p>
      </section>

      <section className="admin-banner card">
        <div className="stack-sm">
          <strong>Sumber data aktif: {admin.dataSource}</strong>
          <p>
            {admin.dataSource === "Supabase PostgreSQL"
              ? "Aplikasi saat ini membaca dan menulis langsung ke Supabase."
              : "Aplikasi masih berjalan dengan fallback lokal. Tambahkan env Supabase untuk mengaktifkan database production-like."}
          </p>
        </div>
        <span className="badge badge-soft">{admin.dataSource === "Supabase PostgreSQL" ? "Live DB" : "Local Mode"}</span>
      </section>

      <section className="dashboard-stats">
        {admin.stats.map((stat) => (
          <article key={stat.label} className="dashboard-stat">
            <strong>{typeof stat.value === "number" ? formatCurrency(stat.value) : stat.value}</strong>
            <p>{stat.label}</p>
          </article>
        ))}
      </section>

      <section className="admin-layout">
        <div className="dashboard-panel card">
          <div className="stack-sm">
            <h2>Pesanan terbaru</h2>
            <p>Semua order terbaru berikut metode fulfillment, pembayaran, dan total belanja.</p>
          </div>

          {admin.recentOrders.length === 0 ? (
            <div className="order-card">
              <h3>Belum ada transaksi</h3>
              <p>Order akan muncul otomatis di sini setelah pengguna melakukan checkout.</p>
            </div>
          ) : (
            <div className="table-scroll">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Pelanggan</th>
                    <th>Pembayaran</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {admin.recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <strong>{order.orderNumber}</strong>
                        <small>{formatDate(order.createdAt)}</small>
                      </td>
                      <td>
                        <strong>{order.shipping.fullName}</strong>
                        <small>{order.fulfillmentMethod}</small>
                      </td>
                      <td>
                        <PaymentStatusPill value={order.paymentStatus} />
                        <small>{order.paymentMethod}</small>
                      </td>
                      <td>
                        <strong>{formatCurrency(order.total)}</strong>
                        <small>{order.items.length} item</small>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <aside className="stack-md">
          <div className="dashboard-panel card">
            <div className="stack-sm">
              <h2>Stok kritis</h2>
              <p>Produk dengan inventory terendah yang perlu dipantau lebih dulu.</p>
            </div>

            {admin.lowStockProducts.length === 0 ? (
              <p className="helper-text">Semua stok masih aman.</p>
            ) : (
              <div className="stack-sm">
                {admin.lowStockProducts.map((product) => (
                  <article key={product.id} className="inventory-card">
                    <div>
                      <strong>{product.name}</strong>
                      <p>{product.category}</p>
                    </div>
                    <span className="inventory-badge">{product.inventory} tersisa</span>
                  </article>
                ))}
              </div>
            )}
          </div>

          <div className="dashboard-panel card">
            <div className="stack-sm">
              <h2>Pelanggan terbaru</h2>
              <p>Akun terbaru yang baru aktif di marketplace.</p>
            </div>

            {admin.recentCustomers.length === 0 ? (
              <p className="helper-text">Belum ada akun pelanggan.</p>
            ) : (
              <div className="stack-sm">
                {admin.recentCustomers.map((customer) => (
                  <article key={customer.id} className="customer-card">
                    <div>
                      <strong>{customer.name}</strong>
                      <p>{customer.email}</p>
                    </div>
                    <small>{customer.role === "admin" ? "Admin" : "Customer"}</small>
                  </article>
                ))}
              </div>
            )}
          </div>
        </aside>
      </section>

      <section className="payment-grid">
        {admin.paymentOverview.map((entry) => (
          <article key={entry.label} className="card payment-card">
            <span className="badge badge-soft">{entry.label}</span>
            <strong>{entry.value}</strong>
            <p>{entry.description}</p>
          </article>
        ))}
      </section>

      <section className="stack-lg">
        <AdminControls
          recentOrders={admin.recentOrders}
          inventoryProducts={admin.inventoryProducts}
        />
      </section>
    </main>
  );
}
