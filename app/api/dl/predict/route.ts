import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { predictPerformance } from '@/lib/dl/lstm-predictor';

// GET - Predict student performance using LSTM
export async function GET(request: NextRequest) {
  const token = request.cookies.get('student_token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload || payload.role !== 'student') {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  try {
    // Fetch all quiz attempts sorted by date
    const { data: attempts, error } = await supabaseAdmin
      .from('quiz_attempts')
      .select('score, total, attempted_at')
      .eq('student_id', payload.id)
      .order('attempted_at', { ascending: true });

    if (error) {
      console.error('Fetch attempts error:', error);
      return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }

    const result = await predictPerformance(attempts || []);

    return NextResponse.json({
      ...result,
      totalAttempts: (attempts || []).length,
      model: 'LSTM (Sequence → Prediction)',
    });
  } catch (error) {
    console.error('Prediction error:', error);
    return NextResponse.json({ error: 'Prediction failed' }, { status: 500 });
  }
}
