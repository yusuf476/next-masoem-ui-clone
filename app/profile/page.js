import Link from "next/link";
import { getCurrentUser } from "../../lib/session";
import { getDashboardData } from "../../lib/market";
import { formatCurrency, formatDate } from "../../lib/format";
import EmailVerificationCard from "../../components/email-verification-card";
import LogoutButton from "../../components/logout-button";
import WishlistPanel from "../../components/wishlist-panel";

const iconBoxStyle = (color) => ({
  width: '44px',
  height: '44px',
  borderRadius: '14px',
  background: color,
  display: 'grid',
  placeItems: 'center',
  flexShrink: 0,
});

const CartSvg = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
);

const BoxSvg = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
);

const ZapSvg = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
);

const ClipboardSvg = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
);

const ShopSvg = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
);

export default async function ProfilePage() {
  const user = await getCurrentUser();

  // --- Guest View: Not Logged In ---
  if (!user) {
    return (
      <main className="container content-section" style={{ maxWidth: '480px', margin: '0 auto', padding: '60px 16px' }}>
        <div className="stack-lg" style={{ textAlign: 'center' }}>
          {/* Avatar Placeholder */}
          <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))', margin: '0 auto', display: 'grid', placeItems: 'center' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>

          <div className="stack-sm">
            <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)' }}>Masuk ke Akun Anda</h1>
            <p style={{ color: 'var(--muted)', maxWidth: '360px', margin: '0 auto' }}>
              Kelola pesanan, lihat riwayat belanja, dan nikmati pengalaman kampus yang lebih personal.
            </p>
          </div>

          <div className="stack-sm" style={{ maxWidth: '320px', margin: '0 auto', width: '100%' }}>
            <Link href="/login" className="button button-primary" style={{ width: '100%', justifyContent: 'center', padding: '16px' }}>
              Masuk
            </Link>
            <Link href="/register" className="button button-secondary" style={{ width: '100%', justifyContent: 'center', padding: '16px' }}>
              Buat Akun Baru
            </Link>
          </div>

          {/* Feature highlights */}
          <div className="stack-sm" style={{ marginTop: '24px' }}>
            {[
              { icon: <CartSvg />, color: 'linear-gradient(135deg, #6366f1, #818cf8)', title: "Keranjang Tersimpan", desc: "Belanjaan Anda tidak akan hilang" },
              { icon: <BoxSvg />, color: 'linear-gradient(135deg, #f97316, #fb923c)', title: "Lacak Pesanan", desc: "Pantau status order real-time" },
              { icon: <ZapSvg />, color: 'linear-gradient(135deg, #10b981, #34d399)', title: "Checkout Cepat", desc: "Satu klik untuk pembelian ulang" },
            ].map((feature) => (
              <div key={feature.title} className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', textAlign: 'left' }}>
                <div style={iconBoxStyle(feature.color)}>{feature.icon}</div>
                <div>
                  <strong style={{ display: 'block', fontSize: '0.95rem' }}>{feature.title}</strong>
                  <small style={{ color: 'var(--muted)' }}>{feature.desc}</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  // --- Authenticated View ---
  const dashboard = await getDashboardData(user.id);
  const tierClassName = `tier-${dashboard.loyalty.tierKey}`;

  return (
    <main className="container content-section" style={{ maxWidth: '560px', margin: '0 auto', padding: '32px 16px' }}>
      <div className="stack-lg">
        {/* Profile Header */}
        <section style={{ textAlign: 'center' }} className="stack-sm">
          <div style={{ width: '88px', height: '88px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))', margin: '0 auto', display: 'grid', placeItems: 'center', color: 'white', fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <h1 style={{ fontSize: '1.5rem', marginTop: '8px', marginBottom: '4px' }}>{user.name}</h1>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className={`tier-badge ${tierClassName}`}>{dashboard.loyalty.tierLabel} Tier</span>
          </div>
          <p style={{ color: 'var(--muted)', fontSize: '0.95rem' }}>{user.email}</p>
        </section>

        {/* Loyalty Progress */}
        <section className="card" style={{ padding: '20px', background: 'linear-gradient(145deg, var(--surface), rgba(30,58,138,0.05))', border: '1px solid var(--border-strong)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div className="stack-xs">
              <strong style={{ fontSize: '1rem' }}>Masoem Poin</strong>
              <small style={{ color: 'var(--muted)' }}>Dapat ditukar dengan diskon</small>
            </div>
            <strong style={{ color: 'var(--primary)', fontSize: '1.2rem' }}>{dashboard.loyalty.points}</strong>
          </div>
          <div className="points-progress-bar" style={{ height: '10px' }}>
            <div className="points-progress-fill" style={{ width: `${dashboard.loyalty.progress}%` }}></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '0.8rem' }}>
            <span style={{ color: 'var(--muted)' }}>{dashboard.loyalty.tierLabel}</span>
            <span style={{ color: '#d97706', fontWeight: 'bold' }}>
              {dashboard.loyalty.nextTierLabel
                ? `${dashboard.loyalty.nextTierLabel} (${dashboard.loyalty.nextTierThreshold})`
                : "Tier tertinggi"}
            </span>
          </div>
          <p style={{ marginTop: '10px', fontSize: '0.85rem' }}>
            {dashboard.loyalty.pointsToNextTier > 0
              ? `Butuh ${dashboard.loyalty.pointsToNextTier} poin lagi untuk naik tier berikutnya.`
              : "Anda sudah berada di tier loyalitas tertinggi."}
          </p>
        </section>

        {/* Info Cards */}
        <section className="stack-sm">
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <small style={{ color: 'var(--muted)', fontWeight: 600 }}>NIM</small>
                <strong style={{ display: 'block', fontSize: '1.05rem' }}>{dashboard.user.studentId}</strong>
              </div>
              <div style={{ textAlign: 'right' }}>
                <small style={{ color: 'var(--muted)', fontWeight: 600 }}>Fakultas</small>
                <strong style={{ display: 'block', fontSize: '1.05rem' }}>{dashboard.user.faculty}</strong>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: '20px' }}>
            <small style={{ color: 'var(--muted)', fontWeight: 600 }}>Bergabung sejak</small>
            <strong style={{ display: 'block', fontSize: '1.05rem' }}>{formatDate(dashboard.user.joinedAt)}</strong>
          </div>
        </section>

        <EmailVerificationCard emailVerifiedAt={dashboard.user.emailVerifiedAt} />

        {/* Wishlist */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.25rem' }}>Daftar Keinginan (Wishlist)</h2>
            <Link href="/products" style={{ color: 'var(--primary)', fontSize: '0.9rem', fontWeight: 600 }}>Cari lagi</Link>
          </div>
          <WishlistPanel />
        </section>

        <section className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.15rem' }}>Aktivitas Terkini</h2>
            <span className="badge badge-soft">{dashboard.recentActivity.length} update</span>
          </div>
          {dashboard.recentActivity.length === 0 ? (
            <p>Belum ada aktivitas akun yang tercatat.</p>
          ) : (
            <div className="stack-sm">
              {dashboard.recentActivity.map((entry) => (
                <article
                  key={entry.id}
                  style={{
                    padding: '14px 16px',
                    borderRadius: '14px',
                    border: '1px solid var(--border)',
                    background: 'var(--surface-strong)',
                  }}
                >
                  <strong style={{ display: 'block', marginBottom: '4px' }}>{entry.title}</strong>
                  <p style={{ marginBottom: '8px' }}>{entry.message}</p>
                  <small style={{ color: 'var(--muted)' }}>{formatDate(entry.createdAt)}</small>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Stats */}
        <section>
          <h2 style={{ fontSize: '1.15rem', marginBottom: '12px' }}>Ringkasan</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            {dashboard.stats.map((stat) => (
              <div key={stat.label} className="card" style={{ padding: '20px', textAlign: 'center' }}>
                <strong style={{ display: 'block', fontSize: '1.3rem', color: 'var(--primary)', fontFamily: 'var(--font-heading)' }}>
                  {typeof stat.value === "number" ? formatCurrency(stat.value) : stat.value}
                </strong>
                <small style={{ color: 'var(--muted)', fontWeight: 600 }}>{stat.label}</small>
              </div>
            ))}
          </div>
        </section>

        {/* Quick Menu Links */}
        <section>
          <h2 style={{ fontSize: '1.15rem', marginBottom: '12px' }}>Menu Cepat</h2>
          <div className="stack-sm">
            {[
              { href: "/dashboard", icon: <ClipboardSvg />, color: 'linear-gradient(135deg, #6366f1, #818cf8)', label: "Riwayat Pesanan", desc: "Lihat semua pesanan Anda" },
              { href: "/products", icon: <ShopSvg />, color: 'linear-gradient(135deg, #f97316, #fb923c)', label: "Katalog Produk", desc: "Jelajahi dan belanja kembali" },
              { href: "/cart", icon: <CartSvg />, color: 'linear-gradient(135deg, #10b981, #34d399)', label: "Keranjang Saya", desc: "Lanjutkan belanja Anda" },
            ].map((item) => (
              <Link key={item.href} href={item.href} className="card" style={{ padding: '18px', display: 'flex', alignItems: 'center', gap: '16px', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}>
                <div style={iconBoxStyle(item.color)}>{item.icon}</div>
                <div style={{ flex: 1 }}>
                  <strong style={{ display: 'block', fontSize: '0.95rem' }}>{item.label}</strong>
                  <small style={{ color: 'var(--muted)' }}>{item.desc}</small>
                </div>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </Link>
            ))}
          </div>
        </section>

        {/* Logout */}
        <section style={{ paddingTop: '8px' }}>
          <LogoutButton />
        </section>
      </div>
    </main>
  );
}
