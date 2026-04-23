import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { classifyStudent } from '@/lib/dl/ann-classifier';

// GET - Classify student level using ANN
export async function GET(request: NextRequest) {
  const token = request.cookies.get('student_token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload || payload.role !== 'student') {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  try {
    // Fetch all quiz attempts for this student
    const { data: attempts, error } = await supabaseAdmin
      .from('quiz_attempts')
      .select('score, total, time_taken_s')
      .eq('student_id', payload.id);

    if (error) {
      console.error('Fetch attempts error:', error);
      return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }

    const result = await classifyStudent(attempts || []);

    return NextResponse.json({
      level: result.level,
      confidence: result.confidence,
      probabilities: result.probabilities,
      features: result.features,
      totalAttempts: (attempts || []).length,
      model: 'ANN (4→16→8→4 Softmax)',
    });
  } catch (error) {
    console.error('Classification error:', error);
    return NextResponse.json({ error: 'Classification failed' }, { status: 500 });
  }
}
