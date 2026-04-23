export default function CatalogLoading() {
  return (
    <main className="catalog-shell">
      <div className="container stack-lg">
        {/* Header Skeleton */}
        <section className="section-heading" style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
          <div className="skeleton skeleton-text" style={{ width: '100px', margin: '0 auto 12px' }}></div>
          <div className="skeleton skeleton-text-lg" style={{ height: '3rem', width: '80%', margin: '0 auto 16px' }}></div>
          <div className="skeleton skeleton-text" style={{ width: '90%', margin: '0 auto' }}></div>
        </section>

        {/* Filter Bar Skeleton */}
        <section className="card" style={{ padding: 16, border: '1px solid var(--border)' }}>
          <div className="skeleton skeleton-text-lg" style={{ height: '60px', width: '100%' }}></div>
        </section>

        {/* Product Grid Skeleton */}
        <section className="product-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <article key={i} className="product-card" style={{ padding: '0' }}>
              <div className="skeleton skeleton-image" style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}></div>
              <div className="product-body stack-sm">
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div className="skeleton skeleton-text" style={{ width: '60px' }}></div>
                  <div className="skeleton skeleton-text" style={{ width: '40px' }}></div>
                </div>
                <div className="skeleton skeleton-text-lg" style={{ width: '80%' }}></div>
                <div className="skeleton skeleton-text" style={{ width: '100%' }}></div>
                <div className="skeleton skeleton-text" style={{ width: '50%' }}></div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                  <div className="skeleton skeleton-text-lg" style={{ width: '90px' }}></div>
                  <div className="skeleton skeleton-text-lg" style={{ width: '90px', borderRadius: '12px' }}></div>
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
