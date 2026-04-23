import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabase';
import { generateOTP, sendOTPEmail } from '@/lib/mailer';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = (body.email || '').trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Rate limit (max 3 reset requests per 15 min)
    const rl = checkRateLimit(`forgot:${email}`, 3, 15 * 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many reset requests. Try again later.' }, { status: 429 });
    }

    // Find student
    const { data: student } = await supabaseAdmin
      .from('students')
      .select('id, email, is_verified')
      .eq('email', email)
      .single();

    if (!student) {
      return NextResponse.json({ error: 'No account found with this email' }, { status: 404 });
    }

    // Only verified students can reset password
    if (!student.is_verified) {
      return NextResponse.json({ error: 'This account is not verified yet. Please verify your email first.' }, { status: 403 });
    }

    // Generate and hash OTP
    const otp = generateOTP();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await supabaseAdmin
      .from('students')
      .update({ otp: hashedOtp, otp_expires_at: otpExpiry, otp_verified_for_reset: false })
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
