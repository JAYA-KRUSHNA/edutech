import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabase';
import { signToken } from '@/lib/auth';
import { checkRateLimit, resetRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const reg_no = (body.reg_no || '').trim();
    const password = (body.password || '').trim();

    if (!reg_no || !password) {
      return NextResponse.json({ error: 'Registration number and password are required' }, { status: 400 });
    }

    // Rate limit by reg_no (prevents brute force)
    const rl = checkRateLimit(`login:${reg_no}`, 5, 15 * 60 * 1000);
    if (!rl.allowed) {
      const mins = Math.ceil(rl.retryAfterMs / 60000);
      return NextResponse.json({ error: `Too many login attempts. Try again in ${mins} minute(s).` }, { status: 429 });
    }

    // Find student
    const { data: student, error } = await supabaseAdmin
      .from('students')
      .select('*')
      .eq('reg_no', reg_no)
      .single();

    if (error || !student) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (!student.is_verified) {
      return NextResponse.json({ error: 'Email not verified. Please verify your email first.' }, { status: 403 });
    }

    // Compare password
    const valid = await bcrypt.compare(password, student.password);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Reset rate limit on successful login
    resetRateLimit(`login:${reg_no}`);

    // Generate token
    const token = await signToken({
      id: student.id,
      email: student.email,
      role: 'student',
      name: student.full_name,
    });

    const response = NextResponse.json({
      message: 'Login successful',
      user: { id: student.id, email: student.email, name: student.full_name, reg_no: student.reg_no },
    });

    response.cookies.set('student_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
