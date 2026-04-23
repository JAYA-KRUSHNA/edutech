'use client';

import { useState } from 'react';

interface AnalysisResult { topics: Array<{ topic: string; confidence: number }>; keywords: Array<{ word: string; score: number }>; difficulty: string; difficultyScore: number; wordCount: number; model: string; }

const SAMPLE_TEXTS = [
  { label: '🧠 Neural Networks', text: 'Backpropagation is a learning algorithm used to train deep neural networks. It works by computing the gradient of the loss function with respect to each weight using the chain rule. The network adjusts its weights through gradient descent to minimize the error. Common activation functions include ReLU, sigmoid, and tanh. Deep learning networks can have multiple hidden layers with dropout regularization to prevent overfitting.' },
  { label: '👁️ Computer Vision', text: 'Convolutional Neural Networks (CNNs) are specialized for image processing tasks. They use convolutional layers with learnable filters to detect features like edges, textures, and objects. Pooling layers reduce spatial dimensions while preserving important features. Architectures like ResNet use skip connections to train very deep networks. Object detection models like YOLO can identify multiple objects in real-time.' },
  { label: '📊 LSTM & RNN', text: 'Long Short-Term Memory networks are a type of recurrent neural network designed to handle sequential data. LSTM cells contain gates that control information flow: the forget gate, input gate, and output gate. These gates allow the network to learn long-term dependencies in sequences like time series, text, and speech. GRU is a simplified variant with fewer parameters.' },
  { label: '🤖 RL', text: 'Q-learning is a model-free reinforcement learning algorithm that learns the value of actions in states. The agent explores the environment using an epsilon-greedy policy, balancing exploration and exploitation. Deep Q-Networks (DQN) combine Q-learning with neural networks to handle large state spaces. Policy gradient methods like PPO directly optimize the policy function.' },
];

export default function NLPAnalyzerPage() {
  const [text, setText] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const analyze = async () => {
    if (!text.trim()) { setError('Please enter or select a text to analyze'); return; }
    setError(''); setLoading(true); setResult(null);
    try {
      const res = await fetch('/api/dl/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Analysis failed'); return; }
      setResult(data);
    } catch { setError('Failed to connect to analysis service'); } finally { setLoading(false); }
  };

  const diffColors: Record<string, string> = { Easy: 'var(--success)', Medium: 'var(--warning)', Hard: 'var(--danger)' };
  const diffEmoji: Record<string, string> = { Easy: '😊', Medium: '🤔', Hard: '🧐' };

  return (
    <div className="p-6 md:p-8 max-w-[1000px] mx-auto">
      <div className="page-header animate-fade-in">
        <h1 className="text-2xl font-bold text-text-1 flex items-center gap-3">
          💬 NLP Text Analyzer <span className="badge badge-primary" style={{ fontSize: 10 }}>Deep Learning</span>
        </h1>
        <p className="text-text-3 mt-2 text-sm">Analyze any text using our BoW + Neural Network model. Detects topics, extracts keywords, and estimates difficulty.</p>
      </div>

      {/* Sample Texts */}
      <div className="mb-5 animate-fade-in animate-fade-in-delay-1">
        <p className="text-xs text-text-3 mb-2 uppercase tracking-wider font-medium">Try a sample</p>
        <div className="flex gap-2 flex-wrap">
          {SAMPLE_TEXTS.map(s => (
            <button key={s.label} onClick={() => { setText(s.text); setResult(null); }}
              className="glass-card-hover px-3 py-2 text-xs cursor-pointer"
              style={{ border: text === s.text ? '1px solid var(--primary)' : '1px solid var(--glass-border)', background: text === s.text ? 'rgba(99,102,241,0.06)' : 'var(--glass)' }}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="glass-card p-6 mb-6 animate-fade-in animate-fade-in-delay-1">
        <label className="label-text mb-2 block">Enter text to analyze</label>
        <textarea className="input-field" placeholder="Paste any text about deep learning, neural networks, computer vision, NLP, etc..."
          value={text} onChange={e => setText(e.target.value)} style={{ minHeight: 130, resize: 'vertical', lineHeight: 1.7 }} />
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-text-3 font-mono">{text.trim().split(/\s+/).filter(Boolean).length} words</span>
          <button onClick={analyze} className="btn-primary text-sm" disabled={loading || !text.trim()}>
            {loading ? <span className="flex items-center gap-2"><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Analyzing...</span> : '🔬 Analyze Text'}
          </button>
        </div>
        {error && <div className="flex items-center gap-2 p-3 rounded-xl text-sm mt-3" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: 'var(--danger-light)' }}>⚠️ {error}</div>}
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-5 animate-fade-in">
          {/* Topics */}
          <div className="glass-card p-6">
            <h3 className="text-base font-semibold text-text-1 mb-4 flex items-center gap-2">
              🏷️ Detected Topics <span className="text-xs text-text-3 font-normal">Neural network classification</span>
            </h3>
            <div className="space-y-3">
              {result.topics.map((t, i) => (
                <div key={t.topic}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-text-2 flex items-center gap-1.5">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'} {t.topic}</span>
                    <span className="text-sm font-bold font-mono" style={{ color: 'var(--primary-light)' }}>{Math.round(t.confidence * 100)}%</span>
                  </div>
                  <div className="progress-bar" style={{ height: 8 }}>
                    <div className="progress-fill" style={{
                      width: `${Math.max(3, t.confidence * 100)}%`,
                      background: i === 0 ? 'linear-gradient(90deg, var(--primary), var(--accent))' : i === 1 ? 'linear-gradient(90deg, var(--primary-dark), var(--primary))' : 'var(--primary-dark)',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Keywords */}
            <div className="glass-card p-6">
              <h3 className="text-base font-semibold text-text-1 mb-4">🔑 Key Terms</h3>
              <div className="flex flex-wrap gap-2">
                {result.keywords.map((kw, i) => (
                  <span key={kw.word} className="tech-chip" style={{
                    background: `rgba(99,102,241,${0.12 - i * 0.008})`,
                    color: 'var(--text-1)',
                    border: `1px solid rgba(99,102,241,${0.2 - i * 0.01})`,
                  }}>
                    {kw.word} <span style={{ opacity: 0.5, marginLeft: 4 }}>{kw.score.toFixed(2)}</span>
                  </span>
                ))}
              </div>
              <p className="text-xs text-text-3 mt-3 pt-3 border-t border-glass-border">TF-IDF scoring with domain relevance boost</p>
            </div>

            {/* Difficulty */}
            <div className="glass-card p-6">
              <h3 className="text-base font-semibold text-text-1 mb-4">📐 Difficulty Analysis</h3>
              <div className="text-center py-3">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-3" style={{ background: `${diffColors[result.difficulty]}12`, border: `2px solid ${diffColors[result.difficulty]}40` }}>
                  <span className="text-3xl">{diffEmoji[result.difficulty]}</span>
                </div>
                <p className="text-xl font-bold text-text-1">{result.difficulty}</p>
                <p className="text-sm text-text-3 mt-1 font-mono">{Math.round(result.difficultyScore * 100)}% complexity</p>
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-xs" style={{ color: 'var(--success)' }}>Easy</span>
                  <div className="progress-bar flex-1" style={{ height: 6 }}>
                    <div className="progress-fill" style={{ width: `${result.difficultyScore * 100}%`, background: 'linear-gradient(90deg, var(--success), var(--warning), var(--danger))' }} />
                  </div>
                  <span className="text-xs" style={{ color: 'var(--danger)' }}>Hard</span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-glass-border flex justify-between text-xs text-text-3">
                <span>Words: {result.wordCount}</span>
                <span>BoW + FFN</span>
              </div>
            </div>
          </div>

          <div className="glass-card p-4 flex items-center justify-between text-xs text-text-3">
            <span>🧠 Model: {result.model}</span>
            <span className="badge badge-primary" style={{ fontSize: 9 }}>TensorFlow.js</span>
          </div>
        </div>
      )}
    </div>
  );
}
