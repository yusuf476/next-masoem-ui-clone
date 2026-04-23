export default function ProductDetailLoading() {
  return (
    <main className="container">
      {/* Breadcrumb Skeleton */}
      <div className="skeleton skeleton-text" style={{ width: '200px', margin: '16px 0 32px' }}></div>

      <section className="detail-layout">
        <div className="detail-visual card" style={{ padding: '0' }}>
          <div className="skeleton skeleton-image" style={{ aspectRatio: '1/1' }}></div>
        </div>

        <div className="detail-content card stack-md">
          <div style={{ display: 'flex', gap: '8px' }}>
            <div className="skeleton skeleton-text" style={{ width: '80px' }}></div>
            <div className="skeleton skeleton-text" style={{ width: '120px' }}></div>
          </div>
          
          <div className="stack-sm">
            <div className="skeleton skeleton-text-lg" style={{ height: '3rem', width: '80%' }}></div>
            <div className="skeleton skeleton-text" style={{ width: '100%' }}></div>
            <div className="skeleton skeleton-text" style={{ width: '90%' }}></div>
          </div>

          <div className="skeleton skeleton-text-lg" style={{ width: '150px' }}></div>

          <div className="detail-feature-grid">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="detail-feature-card">
                <div className="skeleton skeleton-text" style={{ width: '60%' }}></div>
                <div className="skeleton skeleton-text" style={{ width: '100%' }}></div>
              </div>
            ))}
          </div>

          <div className="card" style={{ padding: '24px' }}>
            <div className="skeleton skeleton-text-lg" style={{ width: '100%' }}></div>
            <div className="skeleton skeleton-text-lg" style={{ width: '100%', marginTop: '16px' }}></div>
          </div>
        </div>
      </section>
    </main>
  );
}
