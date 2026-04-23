import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

// POST - Submit quiz attempt
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const token = request.cookies.get('student_token')?.value;
  if (!token) return NextResponse.json({ error: 'Only students can attempt quizzes' }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload || payload.role !== 'student') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { answers, time_taken_s } = await request.json();

    // Get quiz
    const { data: quiz } = await supabaseAdmin
      .from('quizzes')
      .select('id, max_attempts')
      .eq('id', params.id)
      .single();

    if (!quiz) return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });

    // Check attempt limit
    const { count } = await supabaseAdmin
      .from('quiz_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('quiz_id', params.id)
      .eq('student_id', payload.id);

    if ((count || 0) >= quiz.max_attempts) {
      return NextResponse.json({ error: 'Maximum attempts reached' }, { status: 403 });
    }

    // Get correct answers
    const { data: questions } = await supabaseAdmin
      .from('quiz_questions')
      .select('id, correct_option')
      .eq('quiz_id', params.id);

    if (!questions) return NextResponse.json({ error: 'No questions found' }, { status: 404 });

    // Calculate score
    let score = 0;
    const total = questions.length;
    const gradedAnswers: Record<string, { selected: number; correct: number; is_correct: boolean }> = {};

    for (const q of questions) {
      const selected = answers[q.id];
      const isCorrect = selected === q.correct_option;
      if (isCorrect) score++;
      gradedAnswers[q.id] = { selected, correct: q.correct_option, is_correct: isCorrect };
    }

    // Save attempt
    const { data: attempt, error: attemptError } = await supabaseAdmin
      .from('quiz_attempts')
      .insert({
        quiz_id: params.id,
        student_id: payload.id,
        score,
        total,
        answers: gradedAnswers,
        time_taken_s: time_taken_s || 0,
      })
      .select()
      .single();

    if (attemptError) {
      console.error('Attempt save error:', attemptError);
      return NextResponse.json({ error: 'Failed to save attempt' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Quiz submitted successfully',
      attempt_id: attempt.id,
      score,
      total,
      percentage: Math.round((score / total) * 100),
      graded_answers: gradedAnswers,
    });
  } catch (error) {
    console.error('Submit error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
