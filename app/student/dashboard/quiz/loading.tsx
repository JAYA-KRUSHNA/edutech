export default function QuizLoading() {
  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto animate-fade-in">
      <div className="page-header">
        <div className="skeleton" style={{ width: '30%', height: 28 }} />
        <div className="skeleton mt-2" style={{ width: '50%', height: 14 }} />
      </div>
      <div className="skeleton mb-4" style={{ width: 400, height: 42 }} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1,2,3,4,5,6].map(i => (
          <div key={i} className="glass-card p-5 space-y-3">
            <div className="skeleton" style={{ width: '70%', height: 18 }} />
            <div className="skeleton" style={{ width: '40%', height: 12 }} />
            <div className="skeleton" style={{ width: '100%', height: 36 }} />
          </div>
        ))}
      </div>
    </div>
  );
}
