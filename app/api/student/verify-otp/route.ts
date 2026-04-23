import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { signToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, otp, type } = await request.json();

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 });
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

    // Check OTP
    if (student.otp !== otp) {
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
    }

    // Check expiry
    if (new Date(student.otp_expires_at) < new Date()) {
      return NextResponse.json({ error: 'OTP has expired' }, { status: 400 });
    }

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
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('OTP verify error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
