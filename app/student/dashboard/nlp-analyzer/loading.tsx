export default function NLPLoading() {
  return (
    <div className="p-6 md:p-8 max-w-[1000px] mx-auto animate-fade-in">
      <div className="page-header">
        <div className="skeleton" style={{ width: '40%', height: 28 }} />
        <div className="skeleton mt-2" style={{ width: '60%', height: 14 }} />
      </div>
      <div className="flex gap-2 mb-5">
        {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ width: 100, height: 32, borderRadius: 20 }} />)}
      </div>
      <div className="glass-card p-6 space-y-3">
        <div className="skeleton" style={{ width: '20%', height: 14 }} />
        <div className="skeleton" style={{ width: '100%', height: 130 }} />
        <div className="skeleton" style={{ width: 120, height: 36 }} />
      </div>
    </div>
  );
}
