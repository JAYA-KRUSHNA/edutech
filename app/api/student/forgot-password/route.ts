import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generateOTP, sendOTPEmail } from '@/lib/mailer';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Find student
    const { data: student } = await supabaseAdmin
      .from('students')
      .select('id, email')
      .eq('email', email)
      .single();

    if (!student) {
      return NextResponse.json({ error: 'No account found with this email' }, { status: 404 });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await supabaseAdmin
      .from('students')
      .update({ otp, otp_expires_at: otpExpiry, otp_verified_for_reset: false })
      .eq('id', student.id);

    const sent = await sendOTPEmail(email, otp, 'reset');
    if (!sent) {
      return NextResponse.json({ error: 'Failed to send reset email' }, { status: 500 });
    }

    return NextResponse.json({ message: 'OTP sent to your email', email });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
