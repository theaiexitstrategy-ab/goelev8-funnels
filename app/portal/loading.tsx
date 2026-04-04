// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.

export default function PortalLoading() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80 }}>
      <div style={{
        width: 32, height: 32, border: '3px solid #E5E7EB', borderTopColor: '#2563EB',
        borderRadius: '50%', animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
