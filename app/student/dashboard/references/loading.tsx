export default function ReferencesLoading() {
  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto animate-fade-in">
      <div className="page-header">
        <div className="skeleton" style={{ width: '30%', height: 28 }} />
        <div className="skeleton mt-2" style={{ width: '50%', height: 14 }} />
      </div>
      <div className="skeleton mb-4" style={{ width: 400, height: 42 }} />
      <div className="space-y-3">
        {[1,2,3,4,5].map(i => (
          <div key={i} className="glass-card p-5 flex gap-3">
            <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 10 }} />
            <div className="flex-1 space-y-2">
              <div className="skeleton" style={{ width: '50%', height: 16 }} />
              <div className="skeleton" style={{ width: '80%', height: 12 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
