import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

// GET - List all published quizzes
export async function GET(request: NextRequest) {
  // Allow both student and admin tokens
  const studentToken = request.cookies.get('student_token')?.value;
  const adminToken = request.cookies.get('admin_token')?.value;
  const token = studentToken || adminToken;

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const subject = searchParams.get('subject');

  let query = supabaseAdmin
    .from('quizzes')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  if (subject) {
    query = query.ilike('subject', `%${subject}%`);
  }

  const { data: quizzes, error } = await query;

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch quizzes' }, { status: 500 });
  }

  // For each quiz, get question count
  const quizzesWithCounts = await Promise.all(
    (quizzes || []).map(async (quiz) => {
      const { count } = await supabaseAdmin
        .from('quiz_questions')
        .select('*', { count: 'exact', head: true })
        .eq('quiz_id', quiz.id);

      // Get attempt count for current student
      let attemptCount = 0;
      if (payload.role === 'student') {
        const { count: ac } = await supabaseAdmin
          .from('quiz_attempts')
          .select('*', { count: 'exact', head: true })
          .eq('quiz_id', quiz.id)
          .eq('student_id', payload.id);
        attemptCount = ac || 0;
      }

      return { ...quiz, question_count: count || 0, attempt_count: attemptCount };
    })
  );

  return NextResponse.json({ quizzes: quizzesWithCounts });
}

// POST - Create a new quiz
export async function POST(request: NextRequest) {
  const studentToken = request.cookies.get('student_token')?.value;
  const adminToken = request.cookies.get('admin_token')?.value;
  const token = studentToken || adminToken;

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  try {
    const { title, description, subject, max_attempts, questions } = await request.json();

    if (!title || !subject || !questions || questions.length === 0) {
      return NextResponse.json({ error: 'Title, subject, and at least one question are required' }, { status: 400 });
    }

    // Validate each question
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text || !q.options || q.options.length < 2 || q.correct_option === undefined) {
        return NextResponse.json({
          error: `Question ${i + 1}: Must have text, at least 2 options, and a correct answer`
        }, { status: 400 });
      }
      if (q.correct_option < 0 || q.correct_option >= q.options.length) {
        return NextResponse.json({
          error: `Question ${i + 1}: Invalid correct option index`
        }, { status: 400 });
      }
    }

    // Create quiz
    const { data: quiz, error: quizError } = await supabaseAdmin
      .from('quizzes')
      .insert({
        title,
        description: description || '',
        subject,
        created_by_id: payload.id,
        created_by_name: payload.name || payload.email,
        created_by_role: payload.role,
        max_attempts: max_attempts || 1,
      })
      .select()
      .single();

    if (quizError || !quiz) {
      console.error('Quiz creation error:', quizError);
      return NextResponse.json({ error: 'Failed to create quiz' }, { status: 500 });
    }

    // Insert questions
    const questionRows = questions.map((q: { question_text: string; options: string[]; correct_option: number }, idx: number) => ({
      quiz_id: quiz.id,
      question_text: q.question_text,
      options: q.options,
      correct_option: q.correct_option,
      question_order: idx,
    }));

    const { error: qError } = await supabaseAdmin
      .from('quiz_questions')
      .insert(questionRows);

    if (qError) {
      console.error('Questions insert error:', qError);
      // Rollback quiz
      await supabaseAdmin.from('quizzes').delete().eq('id', quiz.id);
      return NextResponse.json({ error: 'Failed to create questions' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Quiz created successfully', quiz_id: quiz.id });
  } catch (error) {
    console.error('Create quiz error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
