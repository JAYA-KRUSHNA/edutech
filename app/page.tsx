import Link from 'next/link';

export default function HomePage() {
  const features = [
    {
      icon: '🧠', title: 'ANN Classification',
      desc: 'Multi-layer neural network classifies students into Beginner, Intermediate, Advanced, and Expert levels based on quiz performance patterns.',
      tech: 'Dense(4→16→8→4) · Softmax · Adam',
      color: '#6366f1', gradient: 'from-indigo-500/20 to-violet-500/20',
    },
    {
      icon: '🔍', title: 'Autoencoder Analysis',
      desc: 'Denoising autoencoder detects knowledge gaps by finding subjects with high reconstruction error — revealing hidden weak areas.',
      tech: 'Encoder-Decoder · Anomaly Detection',
      color: '#f43f5e', gradient: 'from-rose-500/20 to-pink-500/20',
    },
    {
      icon: '📈', title: 'LSTM Predictions',
      desc: 'Recurrent neural network models your sequential quiz scores over time, predicting your next 3 quiz scores using autoregressive generation.',
      tech: 'LSTM(16) · Sliding Window · Time-Series',
      color: '#10b981', gradient: 'from-emerald-500/20 to-teal-500/20',
    },
    {
      icon: '🎯', title: 'NCF Recommendations',
      desc: 'Neural Collaborative Filtering combines user embeddings and item embeddings with an MLP to recommend personalized quizzes and resources.',
      tech: 'Embedding(8) · MLP(32→16→1)',
      color: '#f59e0b', gradient: 'from-amber-500/20 to-orange-500/20',
    },
    {
      icon: '💬', title: 'NLP Text Analyzer',
      desc: 'Bag-of-Words features fed into a feedforward network for topic classification, TF-IDF keyword extraction, and difficulty estimation.',
      tech: 'BoW · FFN · TF-IDF · 8 Topic Classes',
      color: '#8b5cf6', gradient: 'from-violet-500/20 to-purple-500/20',
    },
  ];

  const steps = [
    { num: '01', title: 'Take Quizzes', desc: 'Complete subject-based quizzes to generate performance data', icon: '📝' },
    { num: '02', title: 'AI Analyzes', desc: '5 neural networks process your data in real-time using TensorFlow.js', icon: '⚡' },
    { num: '03', title: 'Get Insights', desc: 'Receive personalized level, predictions, weak areas & recommendations', icon: '✨' },
  ];

  return (
    <main className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-glass-border" style={{ background: 'rgba(6,8,15,0.8)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))', boxShadow: '0 4px 15px rgba(99,102,241,0.3)' }}>
              🎓
            </div>
            <span className="text-lg font-bold gradient-text">EduTech</span>
            <span className="badge badge-accent ml-1" style={{ fontSize: 10 }}>AI Powered</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin/login" className="btn-ghost text-sm py-2 px-4">Admin</Link>
            <Link href="/student/login" className="btn-primary text-sm py-2 px-4">Student Login</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex items-center justify-center px-6 pt-28 pb-12 relative" style={{ minHeight: '88vh' }}>
        {/* Decorative orbs */}
        <div className="absolute top-1/4 left-[15%] w-72 h-72 rounded-full animate-float" style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)', filter: 'blur(40px)', animationDelay: '0s' }} />
        <div className="absolute bottom-1/4 right-[15%] w-64 h-64 rounded-full animate-float" style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.08) 0%, transparent 70%)', filter: 'blur(40px)', animationDelay: '2s' }} />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-8 animate-fade-in" style={{ background: 'rgba(99,102,241,0.06)', borderColor: 'rgba(99,102,241,0.15)' }}>
            <span className="pulse-dot" style={{ width: 6, height: 6, background: 'var(--accent)' }} />
            <span className="text-sm text-text-2">5 Deep Learning Models · TensorFlow.js · Real-Time</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 animate-fade-in animate-fade-in-delay-1" style={{ lineHeight: 1.08, letterSpacing: '-0.02em' }}>
            Learn Smarter with{' '}
            <span className="gradient-text">AI-Powered</span>
            <br />
            Personalization
          </h1>

          <p className="text-lg md:text-xl text-text-2 max-w-2xl mx-auto mb-10 animate-fade-in animate-fade-in-delay-2" style={{ lineHeight: 1.7 }}>
            Our platform uses ANN, Autoencoder, LSTM, NCF, and NLP models to classify your level,
            detect weak areas, predict performance, and recommend resources — all in real-time.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in animate-fade-in-delay-3">
            <Link href="/student/signup" className="btn-primary text-lg px-8 py-4" style={{
              background: 'linear-gradient(135deg, var(--primary), var(--accent-dark))',
              boxShadow: '0 8px 32px rgba(99,102,241,0.3)',
            }}>
              Get Started Free →
            </Link>
            <Link href="/student/login" className="btn-ghost text-lg px-8 py-4">
              Sign In →
            </Link>
          </div>

          {/* Tech badges */}
          <div className="flex items-center justify-center gap-3 mt-12 animate-fade-in animate-fade-in-delay-4 flex-wrap">
            {['Next.js', 'TensorFlow.js', 'Supabase', 'TypeScript'].map(t => (
              <span key={t} className="tech-chip" style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)', color: 'var(--text-3)' }}>
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 border-t border-glass-border relative">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="badge badge-accent mb-4">How It Works</span>
            <h2 className="text-3xl md:text-4xl font-bold text-text-1 mb-4">
              Three Steps to <span className="gradient-text">Smarter Learning</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-12 left-[20%] right-[20%] h-px" style={{ background: 'linear-gradient(90deg, transparent, var(--glass-border), var(--glass-border), transparent)' }} />

            {steps.map((step, i) => (
              <div key={step.num} className="text-center relative" style={{ animationDelay: `${i * 0.15}s` }}>
                <div className="w-24 h-24 rounded-2xl mx-auto mb-6 flex items-center justify-center text-4xl relative" style={{
                  background: 'var(--glass)',
                  border: '1px solid var(--glass-border)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                }}>
                  {step.icon}
                  <span className="absolute -top-2 -right-2 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))', color: 'white' }}>
                    {step.num}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-text-1 mb-2">{step.title}</h3>
                <p className="text-sm text-text-3 max-w-xs mx-auto" style={{ lineHeight: 1.6 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DL Models Section */}
      <section className="py-20 px-6 border-t border-glass-border" style={{ background: 'rgba(13,17,23,0.3)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="badge badge-primary mb-4">Deep Learning Architecture</span>
            <h2 className="text-3xl md:text-4xl font-bold text-text-1 mb-4">
              5 Neural Network Models Working <span className="gradient-text">For You</span>
            </h2>
            <p className="text-text-3 max-w-xl mx-auto" style={{ lineHeight: 1.7 }}>
              Each model is trained in real-time using TensorFlow.js, processing your quiz data to deliver personalized insights.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <div key={f.title}
                className="glass-card-hover p-6 flex flex-col gap-4"
                style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="flex items-center gap-3">
                  <div className="stat-icon" style={{ background: `${f.color}15`, border: `1px solid ${f.color}25` }}>
                    {f.icon}
                  </div>
                  <h3 className="text-base font-semibold text-text-1">{f.title}</h3>
                </div>
                <p className="text-sm text-text-3 leading-relaxed flex-1">{f.desc}</p>
                <div className="pt-3 border-t border-glass-border">
                  <span className="tech-chip" style={{ background: `${f.color}10`, color: f.color, border: `1px solid ${f.color}20` }}>
                    {f.tech}
                  </span>
                </div>
              </div>
            ))}

            {/* Real-Time Training card */}
            <div className="glass-card p-6 flex flex-col justify-center items-center text-center gap-4" style={{ borderTop: '2px solid transparent', borderImage: 'linear-gradient(90deg, var(--primary), var(--accent)) 1' }}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(34,211,238,0.1))', border: '1px solid var(--glass-border)' }}>
                ⚡
              </div>
              <h3 className="text-lg font-semibold text-text-1">Real-Time Training</h3>
              <p className="text-sm text-text-3" style={{ lineHeight: 1.6 }}>
                Models train on-the-fly with your data. No pre-trained weights needed — everything runs client-server with TensorFlow.js.
              </p>
              <Link href="/student/signup" className="btn-primary text-sm mt-2">
                Try It Now →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="py-20 px-6 border-t border-glass-border">
        <div className="max-w-5xl mx-auto">
          <div className="glass-card p-8 md:p-10">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
              {[
                { value: '5', label: 'DL Models', sub: 'ANN, AE, LSTM, NCF, NLP', color: 'var(--primary-light)' },
                { value: '4', label: 'Student Levels', sub: 'Beginner → Expert', color: 'var(--accent)' },
                { value: '3', label: 'Score Predictions', sub: 'via LSTM', color: 'var(--success)' },
                { value: '8', label: 'NLP Topics', sub: 'Auto-classified', color: 'var(--warning)' },
                { value: '∞', label: 'Personalization', sub: 'Adaptive learning', color: 'var(--danger-light)' },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <div className="text-3xl md:text-4xl font-extrabold mb-1" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-sm text-text-1 font-medium">{s.label}</div>
                  <div className="text-xs text-text-3 mt-0.5">{s.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-glass-border py-10 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))' }}>🎓</div>
              <span className="text-sm font-semibold text-text-2">EduTech — AI-Powered Learning Platform</span>
            </div>
            <div className="flex items-center gap-3 flex-wrap justify-center">
              {['Next.js', 'TensorFlow.js', 'Supabase'].map(t => (
                <span key={t} className="tech-chip" style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)', color: 'var(--text-3)', fontSize: 10 }}>
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
