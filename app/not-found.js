import Link from "next/link";

export default function NotFound() {
  return (
    <main className="container content-section" style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
      <div style={{ textAlign: 'center', maxWidth: '480px' }}>
        {/* Big 404 number */}
        <div style={{ position: 'relative', marginBottom: '24px' }}>
          <span style={{ fontSize: 'clamp(6rem, 20vw, 10rem)', fontWeight: 900, fontFamily: 'var(--font-heading)', background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1, display: 'block', letterSpacing: '-4px' }}>
            404
          </span>
        </div>

        <h1 style={{ fontSize: 'clamp(1.3rem, 4vw, 1.8rem)', marginBottom: '12px' }}>
          Halaman Tidak Ditemukan
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '1rem', lineHeight: 1.6, marginBottom: '32px', maxWidth: '360px', margin: '0 auto 32px' }}>
          Sepertinya alamat yang Anda tuju sudah dipindahkan atau tidak pernah ada. Jangan khawatir, kami bantu Anda kembali!
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '280px', margin: '0 auto' }}>
          <Link href="/" className="button button-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px', gap: '8px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            Kembali ke Beranda
          </Link>
          <Link href="/products" className="button button-secondary" style={{ width: '100%', justifyContent: 'center', padding: '14px', gap: '8px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            Jelajahi Katalog
          </Link>
        </div>
      </div>
    </main>
  );
}
