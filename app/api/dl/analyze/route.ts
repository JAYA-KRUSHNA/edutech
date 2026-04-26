import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { analyzeText } from '@/lib/dl/nlp-analyzer';

// POST - Analyze text using NLP
export async function POST(request: NextRequest) {
  const studentToken = request.cookies.get('student_token')?.value;
  const adminToken = request.cookies.get('admin_token')?.value;
  const token = studentToken || adminToken;

  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

  try {
    const { text } = await request.json();

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // Cap text length to prevent model overload
    const trimmedText = text.trim().slice(0, 10000);

    if (trimmedText.length < 10) {
      return NextResponse.json({ error: 'Text must be at least 10 characters long' }, { status: 400 });
    }

    const result = await analyzeText(trimmedText);

    return NextResponse.json({
      ...result,
      model: 'BoW + FFN v2 (48→24→8 Softmax + NER)',
    });
  } catch (error) {
    console.error('NLP analysis error:', error);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}
