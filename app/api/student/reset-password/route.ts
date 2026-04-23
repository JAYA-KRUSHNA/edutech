import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = (body.email || '').trim().toLowerCase();
    const new_password = (body.new_password || '').trim();

    if (!email || !new_password) {
      return NextResponse.json({ error: 'Email and new password are required' }, { status: 400 });
    }

    if (new_password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    if (new_password.length > 128) {
      return NextResponse.json({ error: 'Password is too long' }, { status: 400 });
    }

    // Find student and check if OTP was verified
    const { data: student } = await supabaseAdmin
      .from('students')
      .select('id, otp_verified_for_reset')
      .eq('email', email)
      .single();

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    if (!student.otp_verified_for_reset) {
      return NextResponse.json({ error: 'Please verify OTP first' }, { status: 403 });
    }

    const hashedPassword = await bcrypt.hash(new_password, 12);

    await supabaseAdmin
      .from('students')
      .update({ password: hashedPassword, otp_verified_for_reset: false })
      .eq('id', student.id);

    return NextResponse.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
