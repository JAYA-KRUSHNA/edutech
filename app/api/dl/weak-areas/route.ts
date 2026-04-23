import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { detectWeakAreas } from '@/lib/dl/autoencoder';

// GET - Detect weak areas using Autoencoder
export async function GET(request: NextRequest) {
  const token = request.cookies.get('student_token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload || payload.role !== 'student') {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  try {
    // Fetch attempts with quiz subjects
    const { data: attempts, error } = await supabaseAdmin
      .from('quiz_attempts')
      .select('score, total, quiz_id')
      .eq('student_id', payload.id);

    if (error) {
      console.error('Fetch attempts error:', error);
      return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }

    if (!attempts || attempts.length === 0) {
      return NextResponse.json({
        weakAreas: [],
        overallError: 0,
        subjectCount: 0,
        message: 'No quiz attempts yet. Take some quizzes to get AI insights.',
        model: 'Autoencoder (Encoder-Decoder)',
      });
    }

    // Fetch quiz subjects for each attempt
    const quizIds = [...new Set(attempts.map(a => a.quiz_id))];
    const { data: quizzes } = await supabaseAdmin
      .from('quizzes')
      .select('id, subject')
      .in('id', quizIds);

    const quizSubjectMap = new Map((quizzes || []).map(q => [q.id, q.subject]));

    const attemptsWithSubject = attempts.map(a => ({
      score: a.score,
      total: a.total,
      quiz_subject: quizSubjectMap.get(a.quiz_id) || 'Unknown',
    }));

    const result = await detectWeakAreas(attemptsWithSubject);

    return NextResponse.json({
      ...result,
      model: 'Denoising Autoencoder (Anomaly Detection)',
    });
  } catch (error) {
    console.error('Weak areas error:', error);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}
