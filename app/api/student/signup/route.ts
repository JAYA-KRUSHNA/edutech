import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabase';
import { generateOTP, sendOTPEmail } from '@/lib/mailer';

export async function POST(request: NextRequest) {
  try {
    const { reg_no, password, email, full_name } = await request.json();

    if (!reg_no || !password || !email || !full_name) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    // Validate email domain
    if (!email.endsWith('@rgmcet.edu.in')) {
      return NextResponse.json({ error: 'Email must end with @rgmcet.edu.in' }, { status: 400 });
    }

    // Check if reg_no or email already exists
    const { data: existingReg } = await supabaseAdmin
      .from('students')
      .select('id')
      .eq('reg_no', reg_no)
      .single();

    if (existingReg) {
      return NextResponse.json({ error: 'Registration number already exists' }, { status: 409 });
    }

    const { data: existingEmail } = await supabaseAdmin
      .from('students')
      .select('id')
      .eq('email', email)
      .single();

    if (existingEmail) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 mins

    // Store student (unverified)
    const { error: insertError } = await supabaseAdmin
      .from('students')
      .insert({
        reg_no,
        password: hashedPassword,
        email,
        full_name,
        is_verified: false,
        otp,
        otp_expires_at: otpExpiry,
      });

    if (insertError) {
      console.error('Insert error:', insertError);
      return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
    }

    // Send OTP
    const sent = await sendOTPEmail(email, otp, 'verify');
    if (!sent) {
      return NextResponse.json({ error: 'Failed to send verification email' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'OTP sent to your email. Please verify.',
      email,
    });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
