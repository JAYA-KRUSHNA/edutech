export default function DashboardLoading() {
  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto animate-fade-in">
      <div className="page-header">
        <div className="skeleton" style={{ width: '40%', height: 28 }} />
        <div className="skeleton mt-2" style={{ width: '30%', height: 14 }} />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[1,2,3,4].map(i => (
          <div key={i} className="glass-card p-5 space-y-3">
            <div className="skeleton" style={{ width: '50%', height: 14 }} />
            <div className="skeleton" style={{ width: '60%', height: 24 }} />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {[1,2,3].map(i => (
          <div key={i} className="glass-card p-6 space-y-3">
            <div className="skeleton" style={{ width: '40%', height: 16 }} />
            <div className="skeleton" style={{ width: '100%', height: 80 }} />
            <div className="skeleton" style={{ width: '70%', height: 12 }} />
          </div>
        ))}
      </div>
    </div>
  );
}
