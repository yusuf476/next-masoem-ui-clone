import { redirect } from "next/navigation";
import ProductCard from "../../components/product-card";
import VisualTracker from "../../components/visual-tracker";
import EmptyState from "../../components/empty-state";
import { formatCurrency, formatDate } from "../../lib/format";
import { getDashboardData } from "../../lib/market";
import { getCurrentUser } from "../../lib/session";

export default async function DashboardPage({ searchParams }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/dashboard");
  }

  const dashboard = await getDashboardData(user.id);
  const tierClassName = `tier-${dashboard.loyalty.tierKey}`;
  const params = await searchParams;
  const latestOrderNumber = params.order;

  return (
    <main className="container content-section stack-lg">
      <section className="dashboard-header card" style={{ padding: '32px', background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))', color: 'white', borderRadius: 'var(--radius-xl)' }}>
        <div className="stack-sm">
          <span className="badge" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>Beranda</span>
          <h1 style={{ color: 'white', fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', textShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>Selamat datang, {dashboard.user.name}</h1>
          <p style={{ color: 'rgba(255,255,255,0.85)' }}>Pantau pesanan, isi ulang keranjang, dan kelola aktivitas dari satu tempat.</p>
          {latestOrderNumber ? <p style={{ background: 'rgba(255,255,255,0.15)', padding: '10px 16px', borderRadius: '12px', display: 'inline-block', width: 'fit-content', border: '1px solid rgba(255,255,255,0.2)' }}>✅ Pesanan terbaru <strong>{latestOrderNumber}</strong> berhasil dibuat.</p> : null}
        </div>
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
        <div className="dashboard-panel">
          <div className="stack-sm" style={{ marginBottom: "8px" }}>
            <h2 style={{ fontSize: "1.5rem" }}>Riwayat Pembelian</h2>
          </div>

          {dashboard.orders.length === 0 ? (
            <EmptyState 
              iconType="order"
              title="Belum ada pesanan aktif"
              description="Histori belanja dan status pesanan aktif Anda akan muncul di sini. Mari mulai transaksi perdana Anda!"
            />
          ) : (
            <div className="stack-md">
              {dashboard.orders.map((order) => (
                <article key={order.id} className="order-card card">
                  <div className="order-card-header" style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '12px' }}>
                    <div className="stack-xs">
                      <strong style={{ fontSize: "1.1rem" }}>{order.orderNumber}</strong>
                      <p style={{ fontSize: "0.85rem" }}>{formatDate(order.createdAt)} • {order.fulfillmentMethod}</p>
                    </div>
                    <span className="order-status" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>{order.status}</span>
                  </div>
                  
                  <VisualTracker status={order.status} />
                  
                  <div className="order-item-list" style={{ padding: '4px 0 12px' }}>
                    {order.items.slice(0, 3).map((item) => (
                      <span key={`${order.id}-${item.productId}`} className="order-item-pill">
                        {item.quantity}x {item.name}
                      </span>
                    ))}
                    {order.items.length > 3 && <span className="order-item-pill" style={{ background: 'transparent' }}>+{order.items.length - 3} lainnya</span>}
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--secondary-soft)', padding: '12px 16px', borderRadius: '12px' }}>
                    <div className="stack-xs">
                      <strong style={{ fontSize: "1.15rem", color: 'var(--primary-dark)' }}>{formatCurrency(order.total)}</strong>
                      <small style={{ color: "var(--muted)", fontWeight: 500 }}>{order.paymentMethod} • {order.paymentStatus}</small>
                    </div>
                    {order.paymentStatus === "pending" && order.paymentUrl ? (
                      <a href={order.paymentUrl} className="button button-primary button-small" style={{ boxShadow: 'none' }}>
                        Bayar Sekarang
                      </a>
                    ) : (
                      <small style={{ color: "var(--text)" }}>Selesai Est: <strong>{formatDate(order.estimatedReadyAt)}</strong></small>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <aside className="stack-md">
          <div className="profile-card card" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>Profil Akun</h2>
            <div className="stack-sm">
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '8px' }}>
                <div className="user-avatar" style={{ width: '56px', height: '56px', fontSize: '1.5rem', borderRadius: '18px' }}>
                  {dashboard.user.name.charAt(0)}
                </div>
                <div>
                  <strong style={{ fontSize: '1.1rem' }}>{dashboard.user.name}</strong>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    <span className={`tier-badge ${tierClassName}`}>{dashboard.loyalty.tierLabel} Tier</span>
                  </div>
                </div>
              </div>
              
              <div style={{ background: 'var(--bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', marginTop: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <strong style={{ fontSize: '0.9rem' }}>Masoem Poin</strong>
                  <strong style={{ color: 'var(--primary)', fontSize: '0.9rem' }}>
                    {dashboard.loyalty.points}
                    {dashboard.loyalty.nextTierThreshold ? ` / ${dashboard.loyalty.nextTierThreshold}` : ""}
                  </strong>
                </div>
                <div className="points-progress-bar">
                  <div className="points-progress-fill" style={{ width: `${dashboard.loyalty.progress}%` }}></div>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '8px', marginBottom: 0 }}>
                  {dashboard.loyalty.pointsToNextTier > 0
                    ? `Butuh ${dashboard.loyalty.pointsToNextTier} poin lagi untuk naik ke ${dashboard.loyalty.nextTierLabel}.`
                    : "Tier loyalitas tertinggi sudah tercapai."}
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--muted)', marginTop: '8px', padding: '0 8px' }}>
                <span>{dashboard.user.studentId} • {dashboard.user.faculty}</span>
                <span>Sejak {new Date(dashboard.user.joinedAt).getFullYear()}</span>
              </div>
            </div>
          </div>

          <div className="dashboard-panel card">
            <h2>Aktivitas akun</h2>
            {dashboard.recentActivity.length === 0 ? (
              <p>Belum ada aktivitas akun yang tercatat.</p>
            ) : (
              <div className="stack-sm">
                {dashboard.recentActivity.map((entry) => (
                  <article key={entry.id} className="journey-card">
                    <strong>{entry.title}</strong>
                    <p>{entry.message}</p>
                    <small style={{ color: "var(--muted)" }}>{formatDate(entry.createdAt)}</small>
                  </article>
                ))}
              </div>
            )}
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

