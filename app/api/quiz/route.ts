import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { sanitizeSearch, sanitizeString } from '@/lib/rate-limit';

// GET - List all published quizzes
export async function GET(request: NextRequest) {
  const studentToken = request.cookies.get('student_token')?.value;
  const adminToken = request.cookies.get('admin_token')?.value;
  const token = studentToken || adminToken;

  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const subject = searchParams.get('subject');

  let query = supabaseAdmin
    .from('quizzes')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  if (subject) {
    const sanitized = sanitizeSearch(subject);
    if (sanitized) query = query.ilike('subject', `%${sanitized}%`);
  }

  const { data: quizzes, error } = await query;

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch quizzes' }, { status: 500 });
  }

  const quizList = quizzes || [];

  // Batch fetch question counts (fix N+1)
  const quizIds = quizList.map(q => q.id);

  let questionCounts: Record<string, number> = {};
  if (quizIds.length > 0) {
    const { data: questions } = await supabaseAdmin
      .from('quiz_questions')
      .select('quiz_id')
      .in('quiz_id', quizIds);

    if (questions) {
      for (const q of questions) {
        questionCounts[q.quiz_id] = (questionCounts[q.quiz_id] || 0) + 1;
      }
    }
  }

  // Batch fetch attempt counts for current student
  let attemptCounts: Record<string, number> = {};
  if (payload.role === 'student' && quizIds.length > 0) {
    const { data: attempts } = await supabaseAdmin
      .from('quiz_attempts')
      .select('quiz_id')
      .in('quiz_id', quizIds)
      .eq('student_id', payload.id);

    if (attempts) {
      for (const a of attempts) {
        attemptCounts[a.quiz_id] = (attemptCounts[a.quiz_id] || 0) + 1;
      }
    }
  }

  const quizzesWithCounts = quizList.map(quiz => ({
    ...quiz,
    question_count: questionCounts[quiz.id] || 0,
    attempt_count: attemptCounts[quiz.id] || 0,
  }));

  return NextResponse.json({ quizzes: quizzesWithCounts });
}

// POST - Create a new quiz
export async function POST(request: NextRequest) {
  const studentToken = request.cookies.get('student_token')?.value;
  const adminToken = request.cookies.get('admin_token')?.value;
  const token = studentToken || adminToken;

  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

  try {
    const body = await request.json();
    const title = sanitizeString(body.title, 200);
    const description = sanitizeString(body.description, 2000);
    const subject = sanitizeString(body.subject, 100);
    const max_attempts = Math.min(Math.max(1, parseInt(body.max_attempts) || 1), 99);
    const questions = body.questions;

    if (!title || !subject || !questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: 'Title, subject, and at least one question are required' }, { status: 400 });
    }

    if (questions.length > 100) {
      return NextResponse.json({ error: 'Maximum 100 questions per quiz' }, { status: 400 });
    }

    // Validate each question
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const qText = sanitizeString(q.question_text, 1000);
      if (!qText) {
        return NextResponse.json({ error: `Question ${i + 1}: Text is required` }, { status: 400 });
      }
      if (!Array.isArray(q.options) || q.options.length < 2 || q.options.length > 10) {
        return NextResponse.json({ error: `Question ${i + 1}: Must have 2-10 options` }, { status: 400 });
      }
      // Validate each option is non-empty
      for (let j = 0; j < q.options.length; j++) {
        if (!sanitizeString(q.options[j], 500)) {
          return NextResponse.json({ error: `Question ${i + 1}, Option ${j + 1}: Text is required` }, { status: 400 });
        }
      }
      if (typeof q.correct_option !== 'number' || q.correct_option < 0 || q.correct_option >= q.options.length) {
        return NextResponse.json({ error: `Question ${i + 1}: Invalid correct option index` }, { status: 400 });
      }
    }

    // Create quiz
    const { data: quiz, error: quizError } = await supabaseAdmin
      .from('quizzes')
      .insert({
        title,
        description,
        subject,
        created_by_id: payload.id,
        created_by_name: payload.name || payload.email,
        created_by_role: payload.role,
        max_attempts,
      })
      .select()
      .single();

    if (quizError || !quiz) {
      console.error('Quiz creation error:', quizError);
      return NextResponse.json({ error: 'Failed to create quiz' }, { status: 500 });
    }

    // Insert questions with sanitized text
    const questionRows = questions.map((q: { question_text: string; options: string[]; correct_option: number }, idx: number) => ({
      quiz_id: quiz.id,
      question_text: sanitizeString(q.question_text, 1000),
      options: q.options.map((o: string) => sanitizeString(o, 500)),
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
