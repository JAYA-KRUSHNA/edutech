import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabase';
import { signToken } from '@/lib/auth';
import { checkRateLimit, resetRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = (body.email || '').trim().toLowerCase();
    const otp = (body.otp || '').trim();
    const type = body.type || 'verify';

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 });
    }

    if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      return NextResponse.json({ error: 'OTP must be a 6-digit number' }, { status: 400 });
    }

    // Rate limit OTP attempts (max 5 per email per 15 min)
    const rl = checkRateLimit(`otp:${email}`, 5, 15 * 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many OTP attempts. Please request a new code.' }, { status: 429 });
    }

    // Find student
    const { data: student, error } = await supabaseAdmin
      .from('students')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    if (!student.otp) {
      return NextResponse.json({ error: 'No OTP pending. Please request a new one.' }, { status: 400 });
    }

    // Check expiry first
    if (new Date(student.otp_expires_at) < new Date()) {
      // Clear expired OTP
      await supabaseAdmin
        .from('students')
        .update({ otp: null, otp_expires_at: null })
        .eq('id', student.id);
      return NextResponse.json({ error: 'OTP has expired. Please request a new one.' }, { status: 400 });
    }

    // Compare OTP using bcrypt (OTP is stored hashed)
    const otpValid = await bcrypt.compare(otp, student.otp);
    if (!otpValid) {
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
    }

    // OTP is valid — reset rate limit
    resetRateLimit(`otp:${email}`);

    if (type === 'reset') {
      // For password reset, mark OTP as verified and return
      await supabaseAdmin
        .from('students')
        .update({ otp: null, otp_expires_at: null, otp_verified_for_reset: true })
        .eq('id', student.id);

      return NextResponse.json({ message: 'OTP verified. You can now reset your password.', email });
    }

    // Verify student (signup flow)
    await supabaseAdmin
      .from('students')
      .update({ is_verified: true, otp: null, otp_expires_at: null })
      .eq('id', student.id);

    // Generate token
    const token = await signToken({
      id: student.id,
      email: student.email,
      role: 'student',
      name: student.full_name,
    });

    const response = NextResponse.json({
      message: 'Email verified successfully!',
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
    console.error('OTP verify error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
