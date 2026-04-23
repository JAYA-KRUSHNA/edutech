import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

// GET - Get quiz with questions (for taking or viewing)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const studentToken = request.cookies.get('student_token')?.value;
  const adminToken = request.cookies.get('admin_token')?.value;
  const token = studentToken || adminToken;

  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

  const { data: quiz } = await supabaseAdmin
    .from('quizzes')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!quiz) return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });

  const { data: questions } = await supabaseAdmin
    .from('quiz_questions')
    .select('id, question_text, options, question_order')
    .eq('quiz_id', params.id)
    .order('question_order', { ascending: true });

  // Check attempt count for student
  let attemptCount = 0;
  if (payload.role === 'student') {
    const { count } = await supabaseAdmin
      .from('quiz_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('quiz_id', params.id)
      .eq('student_id', payload.id);
    attemptCount = count || 0;
  }

  // Get past attempts
  let pastAttempts: unknown[] = [];
  if (payload.role === 'student') {
    const { data: attempts } = await supabaseAdmin
      .from('quiz_attempts')
      .select('id, score, total, time_taken_s, attempted_at')
      .eq('quiz_id', params.id)
      .eq('student_id', payload.id)
      .order('attempted_at', { ascending: false });
    pastAttempts = attempts || [];
  }

  return NextResponse.json({
    quiz,
    questions: questions || [],
    attempt_count: attemptCount,
    can_attempt: payload.role === 'student' && attemptCount < quiz.max_attempts,
    past_attempts: pastAttempts,
  });
}

// DELETE - Delete quiz (only creator or admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const studentToken = request.cookies.get('student_token')?.value;
  const adminToken = request.cookies.get('admin_token')?.value;
  const token = studentToken || adminToken;

  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

  const { data: quiz } = await supabaseAdmin
    .from('quizzes')
    .select('created_by_id, created_by_role')
    .eq('id', params.id)
    .single();

  if (!quiz) return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });

  // Only creator or admin/superadmin can delete
  const isCreator = quiz.created_by_id === payload.id;
  const isAdmin = payload.role === 'admin' || payload.role === 'superadmin';

  if (!isCreator && !isAdmin) {
    return NextResponse.json({ error: 'Not authorized to delete this quiz' }, { status: 403 });
  }

  await supabaseAdmin.from('quizzes').delete().eq('id', params.id);

  return NextResponse.json({ message: 'Quiz deleted' });
}
