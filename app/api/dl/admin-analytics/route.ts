import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { classifyStudent, extractFeatures } from '@/lib/dl/ann-classifier';

// GET - Aggregate DL analytics for admin dashboard
export async function GET(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload || (payload.role !== 'admin' && payload.role !== 'superadmin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Fetch all students
    const { data: students } = await supabaseAdmin
      .from('students')
      .select('id, full_name, reg_no, is_verified, created_at');

    // Fetch all quiz attempts
    const { data: allAttempts } = await supabaseAdmin
      .from('quiz_attempts')
      .select('student_id, quiz_id, score, total, time_taken_s, attempted_at')
      .order('attempted_at', { ascending: false });

    // Fetch all quizzes
    const { data: quizzes } = await supabaseAdmin
      .from('quizzes')
      .select('id, title, subject, created_at');

    // Fetch all references
    const { data: references } = await supabaseAdmin
      .from('references_posts')
      .select('id, subject, created_at');

    const studentList = students || [];
    const attempts = allAttempts || [];
    const quizList = quizzes || [];
    const refList = references || [];

    // Group attempts by student
    const studentAttempts = new Map<string, typeof attempts>();
    for (const a of attempts) {
      const list = studentAttempts.get(a.student_id) || [];
      list.push(a);
      studentAttempts.set(a.student_id, list);
    }

    // Classify each active student using ANN features
    const levelDistribution: Record<string, number> = { Beginner: 0, Intermediate: 0, Advanced: 0, Expert: 0 };
    const studentInsights: Array<{
      id: string;
      name: string;
      reg_no: string;
      level: string;
      avgScore: number;
      quizCount: number;
    }> = [];

    for (const student of studentList) {
      const sAttempts = studentAttempts.get(student.id) || [];
      if (sAttempts.length === 0) {
        levelDistribution['Beginner']++;
        studentInsights.push({
          id: student.id,
          name: student.full_name,
          reg_no: student.reg_no,
          level: 'Beginner',
          avgScore: 0,
          quizCount: 0,
        });
        continue;
      }

      const features = extractFeatures(sAttempts.map(a => ({ score: a.score, total: a.total, time_taken_s: a.time_taken_s })));

      // Determine level from features (fast heuristic for admin overview)
      let level: string;
      if (features.avgScore >= 0.75) level = 'Expert';
      else if (features.avgScore >= 0.55) level = 'Advanced';
      else if (features.avgScore >= 0.35) level = 'Intermediate';
      else level = 'Beginner';

      levelDistribution[level]++;
      studentInsights.push({
        id: student.id,
        name: student.full_name,
        reg_no: student.reg_no,
        level,
        avgScore: Math.round(features.avgScore * 100),
        quizCount: sAttempts.length,
      });
    }

    // Subject performance aggregation
    const subjectStats = new Map<string, { totalScore: number; totalMax: number; count: number }>();
    for (const a of attempts) {
      const quiz = quizList.find(q => q.id === a.quiz_id);
      if (!quiz) continue;
      const existing = subjectStats.get(quiz.subject) || { totalScore: 0, totalMax: 0, count: 0 };
      existing.totalScore += a.score;
      existing.totalMax += a.total;
      existing.count++;
      subjectStats.set(quiz.subject, existing);
    }

    const subjectPerformance = Array.from(subjectStats.entries()).map(([subject, stats]) => ({
      subject,
      avgScore: stats.totalMax > 0 ? Math.round((stats.totalScore / stats.totalMax) * 100) : 0,
      totalAttempts: stats.count,
    })).sort((a, b) => b.totalAttempts - a.totalAttempts);

    // Recent activity (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentAttempts = attempts.filter(a => new Date(a.attempted_at) > weekAgo).length;
    const recentStudents = studentList.filter(s => new Date(s.created_at) > weekAgo).length;

    // Platform-wide stats
    const totalScore = attempts.reduce((s, a) => s + a.score, 0);
    const totalMax = attempts.reduce((s, a) => s + a.total, 0);
    const platformAvgScore = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;

    return NextResponse.json({
      overview: {
        totalStudents: studentList.length,
        verifiedStudents: studentList.filter(s => s.is_verified).length,
        totalQuizzes: quizList.length,
        totalReferences: refList.length,
        totalAttempts: attempts.length,
        platformAvgScore,
        recentAttempts,
        recentStudents,
      },
      levelDistribution,
      subjectPerformance,
      topStudents: studentInsights
        .sort((a, b) => b.avgScore - a.avgScore)
        .slice(0, 10),
      model: 'ANN Feature Extraction (Admin Analytics)',
    });
  } catch (error) {
    console.error('Admin analytics error:', error);
    return NextResponse.json({ error: 'Analytics failed' }, { status: 500 });
  }
}
