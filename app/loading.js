export default function Loading() {
  return (
    <main className="container content-section stack-lg">
      <div className="skeleton" style={{ height: '80px', width: '40%', marginBottom: '24px' }}></div>
      <div className="skeleton" style={{ height: '240px', width: '100%', marginBottom: '16px' }}></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
        <div className="skeleton" style={{ height: '300px' }}></div>
        <div className="skeleton" style={{ height: '300px' }}></div>
        <div className="skeleton" style={{ height: '300px' }}></div>
        <div className="skeleton" style={{ height: '300px' }}></div>
      </div>
    </main>
  );
}
