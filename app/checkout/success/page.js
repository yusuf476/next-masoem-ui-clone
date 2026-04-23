import Link from "next/link";
import { getCurrentUser } from "../../../lib/session";
import { redirect } from "next/navigation";

export default async function CheckoutSuccessPage({ searchParams }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const { order } = await searchParams;

  return (
    <main className="container content-section" style={{ maxWidth: '560px', margin: '0 auto', textAlign: 'center', padding: '60px 16px' }}>
      <div className="card" style={{ padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{
          width: '80px', height: '80px', borderRadius: '50%', background: '#10b981', color: 'white', display: 'grid', placeItems: 'center', marginBottom: '24px', animation: 'fadeInUp 0.5s ease'
        }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>

        <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', marginBottom: '8px' }}>Pembayaran Berhasil!</h1>
        <p style={{ color: 'var(--muted)', marginBottom: '32px' }}>
          Terima kasih telah berbelanja di Masoem Market. Pesanan Anda sedang kami proses.
        </p>

        <div style={{ background: 'var(--bg)', padding: '20px', borderRadius: 'var(--radius-lg)', width: '100%', marginBottom: '32px', textAlign: 'left', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ color: 'var(--muted)' }}>Nomor Pesanan</span>
            <strong>{order || 'ORD-UNKNOWN'}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ color: 'var(--muted)' }}>Tanggal Pembelian</span>
            <strong>{new Date().toLocaleDateString('id-ID')}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--muted)' }}>Estimasi Tiba</span>
            <strong>Hari ini, max 1 jam</strong>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px', width: '100%', flexDirection: 'column' }}>
          <Link href={`/dashboard?order=${order}`} className="button button-primary" style={{ justifyContent: 'center', padding: '16px', fontSize: '1.05rem' }}>
            Lacak Pesanan Saya
          </Link>
          <Link href="/products" className="button button-secondary" style={{ justifyContent: 'center', padding: '16px', fontSize: '1.05rem' }}>
            Kembali ke Katalog
          </Link>
        </div>
      </div>
    </main>
  );
}
