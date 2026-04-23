import Link from "next/link";

export default function EmptyState({ iconType = "cart", title, description, href = "/products", actionLabel = "Jelajahi Katalog" }) {
  
  const getIcon = () => {
    if (iconType === "cart") {
      return (
        <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="url(#paint0_linear_cart)" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round">
          <defs>
            <linearGradient id="paint0_linear_cart" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
              <stop stopColor="#3b82f6" />
              <stop offset="1" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
          <circle cx="9" cy="21" r="1" strokeWidth="2"/><circle cx="20" cy="21" r="1" strokeWidth="2"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
      );
    } else if (iconType === "order") {
      return (
        <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="url(#paint0_linear_order)" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round">
          <defs>
            <linearGradient id="paint0_linear_order" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
              <stop stopColor="#10b981" />
              <stop offset="1" stopColor="#3b82f6" />
            </linearGradient>
          </defs>
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      );
    } else if (iconType === "wishlist") {
      return (
        <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="url(#paint0_linear_wishlist)" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round">
          <defs>
            <linearGradient id="paint0_linear_wishlist" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
              <stop stopColor="#ef4444" />
              <stop offset="1" stopColor="#f59e0b" />
            </linearGradient>
          </defs>
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      );
    }
  };

  return (
    <div className="card empty-state" style={{ padding: '60px 20px', textAlign: 'center', background: 'var(--surface-strong)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)' }}>
      <div style={{ marginBottom: '24px', opacity: 0.8 }}>
        {getIcon()}
      </div>
      <h2 style={{ fontSize: '1.4rem', marginBottom: '8px' }}>{title}</h2>
      <p style={{ color: 'var(--muted)', maxWidth: '320px', margin: '0 auto 32px', lineHeight: 1.6 }}>
        {description}
      </p>
      <Link href={href} className="button button-primary" style={{ padding: '14px 28px', borderRadius: '30px', boxShadow: '0 8px 16px rgba(59, 130, 246, 0.25)' }}>
        {actionLabel}
      </Link>
    </div>
  );
}
