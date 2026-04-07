import { redirect } from "next/navigation";
import ProductCard from "../../components/product-card";
import { formatCurrency, formatDate } from "../../lib/format";
import { getDashboardData } from "../../lib/market";
import { getCurrentUser } from "../../lib/session";

export default async function DashboardPage({ searchParams }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/dashboard");
  }

  const dashboard = await getDashboardData(user.id);
  const params = await searchParams;
  const latestOrderNumber = params.order;

  return (
    <main className="container content-section stack-lg">
      <section className="section-heading">
        <span className="badge badge-strong">Dashboard</span>
        <h1>Selamat datang kembali, {dashboard.user.name}</h1>
        <p>Kelola profil, pantau pesanan terakhir, dan lanjutkan aktivitas belanja Anda dari sini.</p>
        {latestOrderNumber ? <p className="helper-text helper-text-success">Pesanan {latestOrderNumber} berhasil dibuat.</p> : null}
      </section>

      <section className="dashboard-stats">
        {dashboard.stats.map((stat) => (
          <article key={stat.label} className="dashboard-stat">
            <strong>{typeof stat.value === "number" ? formatCurrency(stat.value) : stat.value}</strong>
            <p>{stat.label}</p>
          </article>
        ))}
      </section>

      <section className="dashboard-layout">
        <div className="dashboard-panel card">
          <div className="stack-sm">
            <h2>Riwayat pesanan</h2>
            <p>Semua pembelian terbaru Anda akan muncul di sini lengkap dengan total dan estimasi selesai.</p>
          </div>

          {dashboard.orders.length === 0 ? (
            <div className="order-card">
              <h3>Belum ada pesanan</h3>
              <p>Mulai dari katalog produk untuk membuat transaksi pertama Anda.</p>
            </div>
          ) : (
            dashboard.orders.map((order) => (
              <article key={order.id} className="order-card">
                <div className="order-card-header">
                  <div>
                    <strong>{order.orderNumber}</strong>
                    <p>{formatDate(order.createdAt)}</p>
                  </div>
                  <span className="order-status">{order.status}</span>
                </div>
                <p>
                  {order.items.length} item | {order.fulfillmentMethod} | {order.paymentMethod}
                </p>
                <strong>{formatCurrency(order.total)}</strong>
                <small style={{ color: "var(--muted)" }}>
                  Estimasi selesai: {formatDate(order.estimatedReadyAt)}
                </small>
                <small style={{ color: "var(--muted)" }}>
                  Status pembayaran: {order.paymentStatus ?? "paid"}
                </small>
                <div className="order-item-list">
                  {order.items.slice(0, 3).map((item) => (
                    <span key={`${order.id}-${item.productId}`} className="order-item-pill">
                      {item.quantity}x {item.name}
                    </span>
                  ))}
                </div>
                {order.paymentStatus === "pending" && order.paymentUrl ? (
                  <a href={order.paymentUrl} className="button button-secondary button-small">
                    Lanjutkan pembayaran
                  </a>
                ) : null}
              </article>
            ))
          )}
        </div>

        <aside className="stack-md">
          <div className="profile-card card">
            <h2>Profil akun</h2>
            <div className="stack-sm">
              <div>
                <strong>{dashboard.user.name}</strong>
                <p>{dashboard.user.email}</p>
              </div>
              <div>
                <strong>{dashboard.user.studentId}</strong>
                <p>{dashboard.user.faculty}</p>
              </div>
              <div>
                <strong>{dashboard.user.phone}</strong>
                <p>Joined {formatDate(dashboard.user.joinedAt)}</p>
              </div>
            </div>
          </div>

          <div className="dashboard-panel card">
            <h2>Langkah berikutnya</h2>
            <div className="stack-sm">
              <article className="journey-card">
                <strong>Isi ulang keranjang</strong>
                <p>Tambahkan kebutuhan kuliah atau makanan favorit untuk pesanan berikutnya.</p>
              </article>
              <article className="journey-card">
                <strong>Pantau status order</strong>
                <p>Cek perubahan status pembayaran dan kesiapan pesanan langsung dari dashboard.</p>
              </article>
              <article className="journey-card">
                <strong>Belanja lebih cepat</strong>
                <p>Gunakan rekomendasi produk di bawah untuk reorder tanpa mulai dari nol.</p>
              </article>
            </div>
          </div>

          <div className="dashboard-panel card">
            <h2>Rekomendasi produk</h2>
            <div className="stack-md">
              {dashboard.recommendations.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}

