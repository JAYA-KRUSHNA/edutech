'use client';

import { useState, useEffect } from 'react';

interface SimplifiedTerm { term: string; explanation: string; context: string; }
interface AnalysisResult { topics: Array<{ topic: string; confidence: number }>; keywords: Array<{ word: string; score: number }>; difficulty: string; difficultyScore: number; wordCount: number; model: string; bigramsFound?: string[]; readabilityMetrics?: { avgWordLength: number; avgSentenceLength: number; techDensity: number; vocabularyRichness?: number }; simplifiedTerms?: SimplifiedTerm[]; simplifiedText?: string; summary?: string[]; entities?: Array<{ name: string; type: string }>; topicCoherence?: number; }

const SAMPLE_TEXTS = [
  { label: '🧠 Neural Networks', text: 'Backpropagation is a learning algorithm used to train deep neural networks. It works by computing the gradient of the loss function with respect to each weight using the chain rule. The network adjusts its weights through gradient descent to minimize the error. Common activation functions include ReLU, sigmoid, and tanh. Deep learning networks can have multiple hidden layers with dropout regularization to prevent overfitting.' },
  { label: '👁️ Computer Vision', text: 'Convolutional Neural Networks (CNNs) are specialized for image processing tasks. They use convolutional layers with learnable filters to detect features like edges, textures, and objects. Pooling layers reduce spatial dimensions while preserving important features. Architectures like ResNet use skip connections to train very deep networks. Object detection models like YOLO can identify multiple objects in real-time.' },
  { label: '📊 LSTM & RNN', text: 'Long Short-Term Memory networks are a type of recurrent neural network designed to handle sequential data. LSTM cells contain gates that control information flow: the forget gate, input gate, and output gate. These gates allow the network to learn long-term dependencies in sequences like time series, text, and speech. GRU is a simplified variant with fewer parameters.' },
  { label: '🤖 RL', text: 'Q-learning is a model-free reinforcement learning algorithm that learns the value of actions in states. The agent explores the environment using an epsilon-greedy policy, balancing exploration and exploitation. Deep Q-Networks (DQN) combine Q-learning with neural networks to handle large state spaces. Policy gradient methods like PPO directly optimize the policy function.' },
];

interface HistoryItem { text: string; result: AnalysisResult; timestamp: number; }

export default function NLPAnalyzerPage() {
  const [text, setText] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showSimplified, setShowSimplified] = useState(false);

  useEffect(() => {
    try { const saved = sessionStorage.getItem('nlp_history'); if (saved) setHistory(JSON.parse(saved)); } catch { /* ignore */ }
  }, []);

  const saveHistory = (newItem: HistoryItem) => {
    const updated = [newItem, ...history].slice(0, 5);
    setHistory(updated);
    try { sessionStorage.setItem('nlp_history', JSON.stringify(updated)); } catch { /* ignore */ }
  };

  const analyze = async () => {
    if (!text.trim()) { setError('Please enter or select a text to analyze'); return; }
    setError(''); setLoading(true); setResult(null);
    try {
      const res = await fetch('/api/dl/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Analysis failed'); return; }
      setResult(data);
      saveHistory({ text: text.slice(0, 100), result: data, timestamp: Date.now() });
    } catch { setError('Failed to connect to analysis service'); } finally { setLoading(false); }
  };

  const copyResults = () => {
    if (!result) return;
    const txt = `Topics: ${result.topics.map(t => `${t.topic} (${Math.round(t.confidence * 100)}%)`).join(', ')}\nKeywords: ${result.keywords.map(k => k.word).join(', ')}\nDifficulty: ${result.difficulty} (${Math.round(result.difficultyScore * 100)}%)\nWords: ${result.wordCount}`;
    navigator.clipboard.writeText(txt);
  };

  const diffColors: Record<string, string> = { Easy: 'var(--success)', Medium: 'var(--warning)', Hard: 'var(--danger)' };
  const diffEmoji: Record<string, string> = { Easy: '😊', Medium: '🤔', Hard: '🧐' };

  return (
    <div className="p-6 md:p-8 max-w-[1000px] mx-auto">
      <div className="page-header animate-fade-in flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-1 flex items-center gap-3">
            💬 NLP Text Analyzer <span className="badge badge-primary" style={{ fontSize: 10 }}>Deep Learning</span>
          </h1>
          <p className="text-text-3 mt-2 text-sm">Analyze any text using our BoW + Neural Network model. Detects topics, extracts keywords, and estimates difficulty.</p>
        </div>
        {history.length > 0 && (
          <button className="btn-ghost text-xs" onClick={() => setShowHistory(!showHistory)}>
            {showHistory ? '✕ Close' : `📜 History (${history.length})`}
          </button>
        )}
      </div>

      {/* History Panel */}
      {showHistory && history.length > 0 && (
        <div className="glass-card p-4 mb-5 animate-scale-in">
          <h4 className="text-sm font-semibold text-text-1 mb-3">Recent Analyses</h4>
          <div className="space-y-2">
            {history.map((h, i) => (
              <button key={i} onClick={() => { setText(h.text); setResult(h.result); setShowHistory(false); }} className="w-full text-left p-3 rounded-xl transition-all hover:translate-x-1" style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)' }}>
                <p className="text-xs text-text-2 truncate">{h.text}...</p>
                <p className="text-xs text-text-3 mt-1">{h.result.topics[0]?.topic} · {h.result.difficulty} · {new Date(h.timestamp).toLocaleTimeString()}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Samples */}
      <div className="mb-5 animate-fade-in-delay-1" style={{ opacity: 0 }}>
        <p className="text-xs text-text-3 mb-2 uppercase tracking-wider font-medium">Try a sample</p>
        <div className="flex gap-2 flex-wrap">
          {SAMPLE_TEXTS.map(s => (
            <button key={s.label} onClick={() => { setText(s.text); setResult(null); }}
              className="filter-chip" style={{ background: text === s.text ? 'rgba(99,102,241,0.12)' : undefined, color: text === s.text ? 'var(--primary-light)' : undefined, borderColor: text === s.text ? 'rgba(99,102,241,0.3)' : undefined }}>{s.label}</button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="glass-card p-6 mb-6 animate-fade-in-delay-1" style={{ opacity: 0 }}>
        <label className="label-text mb-2 block">Enter text to analyze</label>
        <textarea className="input-field" placeholder="Paste any text about deep learning, neural networks, computer vision, NLP, etc..." value={text} onChange={e => setText(e.target.value)} style={{ minHeight: 130, resize: 'vertical', lineHeight: 1.7 }} />
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-text-3 font-mono">{text.trim().split(/\s+/).filter(Boolean).length} words</span>
          <div className="flex gap-2">
            {text.trim() && <button onClick={() => { setText(''); setResult(null); }} className="btn-ghost text-xs" style={{ padding: '6px 12px' }}>Clear</button>}
            <button onClick={analyze} className="btn-primary text-sm" disabled={loading || !text.trim()}>
              {loading ? <span className="flex items-center gap-2"><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Analyzing...</span> : '🔬 Analyze Text'}
            </button>
          </div>
        </div>
        {error && <div className="flex items-center gap-2 p-3 rounded-xl text-sm mt-3" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: 'var(--danger-light)' }}>⚠️ {error}</div>}
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-5 animate-fade-in">
          {/* Topics */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-text-1 flex items-center gap-2">🏷️ Detected Topics</h3>
              <button onClick={copyResults} className="btn-ghost text-xs" style={{ padding: '4px 10px' }}>📋 Copy</button>
            </div>
            <div className="space-y-3">
              {result.topics.map((t, i) => (
                <div key={t.topic}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-text-2 flex items-center gap-1.5">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'} {t.topic}</span>
                    <span className="text-sm font-bold font-mono" style={{ color: 'var(--primary-light)' }}>{Math.round(t.confidence * 100)}%</span>
                  </div>
                  <div className="progress-bar" style={{ height: 8 }}>
                    <div className="progress-fill" style={{ width: `${Math.max(3, t.confidence * 100)}%`, background: i === 0 ? 'linear-gradient(90deg, var(--primary), var(--accent))' : i === 1 ? 'var(--primary)' : 'var(--primary-dark)' }} />
                  </div>
                </div>
              ))}
            </div>
            {result.bigramsFound && result.bigramsFound.length > 0 && (
              <div className="mt-3 pt-3 border-t border-glass-border">
                <p className="text-xs text-text-3 mb-2">Compound terms detected:</p>
                <div className="flex gap-2 flex-wrap">{result.bigramsFound.map(bg => <span key={bg} className="badge badge-accent" style={{ fontSize: 10 }}>{bg}</span>)}</div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Keywords */}
            <div className="glass-card p-6">
              <h3 className="text-base font-semibold text-text-1 mb-4">🔑 Key Terms</h3>
              <div className="flex flex-wrap gap-2">
                {result.keywords.map((kw, i) => (
                  <span key={kw.word} className="tech-chip" style={{ background: `rgba(99,102,241,${0.12 - i * 0.008})`, color: 'var(--text-1)', border: `1px solid rgba(99,102,241,${0.2 - i * 0.01})` }}>
                    {kw.word} <span style={{ opacity: 0.5, marginLeft: 4 }}>{kw.score.toFixed(2)}</span>
                  </span>
                ))}
              </div>
              <p className="text-xs text-text-3 mt-3 pt-3 border-t border-glass-border">TF-IDF scoring with domain relevance boost</p>
            </div>

            {/* Difficulty + Readability */}
            <div className="glass-card p-6">
              <h3 className="text-base font-semibold text-text-1 mb-4">📐 Difficulty & Readability</h3>
              <div className="text-center py-2">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-3" style={{ background: `${diffColors[result.difficulty]}12`, border: `2px solid ${diffColors[result.difficulty]}40` }}>
                  <span className="text-3xl">{diffEmoji[result.difficulty]}</span>
                </div>
                <p className="text-xl font-bold text-text-1">{result.difficulty}</p>
                <p className="text-sm text-text-3 mt-1 font-mono">{Math.round(result.difficultyScore * 100)}% complexity</p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs" style={{ color: 'var(--success)' }}>Easy</span>
                  <div className="progress-bar flex-1" style={{ height: 6 }}><div className="progress-fill" style={{ width: `${result.difficultyScore * 100}%`, background: 'linear-gradient(90deg, var(--success), var(--warning), var(--danger))' }} /></div>
                  <span className="text-xs" style={{ color: 'var(--danger)' }}>Hard</span>
                </div>
              </div>
              {result.readabilityMetrics && (
                <div className="mt-3 pt-3 border-t border-glass-border grid grid-cols-3 gap-2 text-center">
                  <div><p className="text-lg font-bold font-mono text-text-1">{result.readabilityMetrics.avgWordLength}</p><p className="text-xs text-text-3">Avg Word Len</p></div>
                  <div><p className="text-lg font-bold font-mono text-text-1">{result.readabilityMetrics.avgSentenceLength}</p><p className="text-xs text-text-3">Avg Sent Len</p></div>
                  <div><p className="text-lg font-bold font-mono text-text-1">{result.readabilityMetrics.techDensity}%</p><p className="text-xs text-text-3">Tech Density</p></div>
                </div>
              )}
            </div>
          </div>

          {/* Simplified Text — Jargon Decoder */}
          {result.simplifiedTerms && result.simplifiedTerms.length > 0 && (
            <div className="glass-card p-6" style={{ border: '1px solid rgba(16,185,129,0.15)' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-text-1 flex items-center gap-2">
                  🔓 Jargon Decoder
                  <span className="badge badge-success" style={{ fontSize: 9 }}>{result.simplifiedTerms.length} terms</span>
                </h3>
                <button onClick={() => setShowSimplified(!showSimplified)} className="btn-ghost text-xs" style={{ padding: '4px 10px' }}>
                  {showSimplified ? '📄 Show Glossary' : '📖 Show Simplified Text'}
                </button>
              </div>

              {showSimplified ? (
                <div style={{ background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.1)', borderRadius: 12, padding: 16 }}>
                  <p className="text-xs text-text-3 mb-3 uppercase tracking-wider font-medium">✨ Simplified version (jargon decoded inline)</p>
                  <p className="text-sm text-text-2" style={{ lineHeight: 1.9 }}>
                    {result.simplifiedText}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {result.simplifiedTerms.map(item => (
                    <div key={item.term} className="flex gap-3 p-3 rounded-xl" style={{ background: 'var(--glass)' }}>
                      <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.15)' }}>📗</div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-semibold" style={{ color: 'var(--success)' }}>{item.term}</span>
                        <p className="text-sm text-text-2 mt-0.5" style={{ lineHeight: 1.6 }}>→ {item.explanation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Summary */}
          {result.summary && result.summary.length > 0 && (
            <div className="glass-card p-6">
              <h3 className="text-base font-semibold text-text-1 mb-3 flex items-center gap-2">📝 Key Sentences</h3>
              <div className="space-y-2">
                {result.summary.map((sent, i) => (
                  <div key={i} className="flex gap-2 p-3 rounded-xl" style={{ background: 'var(--glass)' }}>
                    <span className="text-primary-light font-bold text-sm flex-shrink-0">{i + 1}.</span>
                    <p className="text-sm text-text-2" style={{ lineHeight: 1.6 }}>{sent}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="glass-card p-4 flex items-center justify-between text-xs text-text-3">
            <span>🧠 Model: {result.model}</span>
            <div className="flex items-center gap-2">
              {result.topicCoherence != null && <span>Coherence: {Math.round(result.topicCoherence * 100)}%</span>}
              <span className="badge badge-primary" style={{ fontSize: 9 }}>TensorFlow.js</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
