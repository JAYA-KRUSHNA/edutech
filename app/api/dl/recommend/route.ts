import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { generateRecommendations } from '@/lib/dl/ncf-recommender';

// GET - Get quiz/reference recommendations using NCF
export async function GET(request: NextRequest) {
  const token = request.cookies.get('student_token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload || payload.role !== 'student') {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  try {
    // Fetch all quiz attempts (all students for collaborative filtering)
    const { data: allAttempts } = await supabaseAdmin
      .from('quiz_attempts')
      .select('student_id, quiz_id, score, total');

    // Fetch all published quizzes
    const { data: allQuizzes } = await supabaseAdmin
      .from('quizzes')
      .select('id, title, subject')
      .eq('is_published', true);

    // Fetch all references
    const { data: allReferences } = await supabaseAdmin
      .from('references_posts')
      .select('id, title, subject');

    const result = await generateRecommendations(
      payload.id,
      allAttempts || [],
      allQuizzes || [],
      allReferences || []
    );

    return NextResponse.json({
      ...result,
      model: 'NCF (User×Item Embedding + MLP)',
    });
  } catch (error) {
    console.error('Recommendation error:', error);
    return NextResponse.json({ error: 'Recommendation failed' }, { status: 500 });
  }
}
