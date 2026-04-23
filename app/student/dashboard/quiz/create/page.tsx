'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Question {
  question_text: string;
  options: string[];
  correct_option: number;
}

export default function CreateQuiz() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [questions, setQuestions] = useState<Question[]>([
    { question_text: '', options: ['', ''], correct_option: 0 },
  ]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const addQuestion = () => {
    setQuestions([...questions, { question_text: '', options: ['', ''], correct_option: 0 }]);
  };

  const removeQuestion = (idx: number) => {
    if (questions.length <= 1) return;
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const updateQuestion = (idx: number, field: string, value: string) => {
    const q = [...questions];
    (q[idx] as unknown as Record<string, unknown>)[field] = value;
    setQuestions(q);
  };

  const addOption = (qIdx: number) => {
    const q = [...questions];
    q[qIdx].options.push('');
    setQuestions(q);
  };

  const removeOption = (qIdx: number, oIdx: number) => {
    if (questions[qIdx].options.length <= 2) return;
    const q = [...questions];
    q[qIdx].options = q[qIdx].options.filter((_, i) => i !== oIdx);
    if (q[qIdx].correct_option >= q[qIdx].options.length) {
      q[qIdx].correct_option = 0;
    }
    setQuestions(q);
  };

  const updateOption = (qIdx: number, oIdx: number, value: string) => {
    const q = [...questions];
    q[qIdx].options[oIdx] = value;
    setQuestions(q);
  };

  const setCorrect = (qIdx: number, oIdx: number) => {
    const q = [...questions];
    q[qIdx].correct_option = oIdx;
    setQuestions(q);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim() || !subject.trim()) {
      setError('Title and subject are required');
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text.trim()) { setError(`Question ${i + 1}: Text is required`); return; }
      for (let j = 0; j < q.options.length; j++) {
        if (!q.options[j].trim()) { setError(`Question ${i + 1}, Option ${j + 1}: Text is required`); return; }
      }
    }

    setLoading(true);
    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, subject, max_attempts: maxAttempts, questions }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      router.push('/student/dashboard/quiz');
    } catch {
      setError('Failed to create quiz');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8" style={{ maxWidth: 800, margin: '0 auto' }}>
      <div className="mb-8 animate-fade-in">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-1)' }}>✨ Create Quiz</h1>
        <p style={{ color: 'var(--text-3)', fontSize: 14, marginTop: 4 }}>Create a quiz for everyone to take</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Quiz Details */}
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ color: 'var(--text-1)', fontWeight: 600, marginBottom: 16 }}>Quiz Details</h3>
          <div style={{ display: 'grid', gap: 16 }}>
            <div>
              <label className="label-text">Title *</label>
              <input className="input-field" placeholder="e.g. Neural Networks Basics" value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label className="label-text">Subject *</label>
                <input className="input-field" placeholder="e.g. Deep Learning" value={subject} onChange={e => setSubject(e.target.value)} />
              </div>
              <div>
                <label className="label-text">Max Attempts per Student</label>
                <input className="input-field" type="number" min={1} max={99} value={maxAttempts} onChange={e => setMaxAttempts(parseInt(e.target.value) || 1)} />
              </div>
            </div>
            <div>
              <label className="label-text">Description (optional)</label>
              <textarea className="input-field" style={{ minHeight: 80, resize: 'vertical' }} placeholder="Brief description..." value={description} onChange={e => setDescription(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Questions */}
        {questions.map((q, qIdx) => (
          <div key={qIdx} className="glass-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ color: 'var(--text-1)', fontWeight: 600 }}>Question {qIdx + 1}</h3>
              {questions.length > 1 && (
                <button type="button" onClick={() => removeQuestion(qIdx)}
                  style={{ color: 'var(--danger)', cursor: 'pointer', fontSize: 13, background: 'none', border: 'none' }}>
                  🗑️ Remove
                </button>
              )}
            </div>

            <div style={{ marginBottom: 16 }}>
              <label className="label-text">Question Text *</label>
              <input className="input-field" placeholder="Type your question..."
                value={q.question_text} onChange={e => updateQuestion(qIdx, 'question_text', e.target.value)} />
            </div>

            <label className="label-text">Options (click radio to mark correct) *</label>
            <div style={{ display: 'grid', gap: 8 }}>
              {q.options.map((opt, oIdx) => (
                <div key={oIdx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="radio" name={`correct-${qIdx}`}
                    checked={q.correct_option === oIdx}
                    onChange={() => setCorrect(qIdx, oIdx)}
                    style={{ accentColor: 'var(--success)', width: 18, height: 18, cursor: 'pointer' }} />
                  <input className="input-field" style={{ flex: 1 }}
                    placeholder={`Option ${oIdx + 1}`}
                    value={opt} onChange={e => updateOption(qIdx, oIdx, e.target.value)} />
                  {q.options.length > 2 && (
                    <button type="button" onClick={() => removeOption(qIdx, oIdx)}
                      style={{ color: 'var(--danger)', cursor: 'pointer', background: 'none', border: 'none', fontSize: 16 }}>✕</button>
                  )}
                </div>
              ))}
            </div>
            <button type="button" onClick={() => addOption(qIdx)}
              style={{ marginTop: 8, color: 'var(--primary-light)', cursor: 'pointer', fontSize: 13, background: 'none', border: 'none' }}>
              + Add Option
            </button>
          </div>
        ))}

        <button type="button" onClick={addQuestion} className="btn-ghost" style={{ width: '100%', fontSize: 14 }}>
          + Add Question
        </button>

        {error && <p className="error-text" style={{ textAlign: 'center' }}>⚠️ {error}</p>}

        <div style={{ display: 'flex', gap: 12 }}>
          <button type="button" onClick={() => router.back()} className="btn-ghost" style={{ flex: 1 }}>Cancel</button>
          <button type="submit" className="btn-primary" style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }} disabled={loading}>
            {loading ? <span className="spinner" style={{ width: 18, height: 18 }} /> : null}
            {loading ? 'Creating...' : 'Publish Quiz 🚀'}
          </button>
        </div>
      </form>
    </div>
  );
}
