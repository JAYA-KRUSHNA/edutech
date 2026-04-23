import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabase';
import { generateOTP, sendOTPEmail } from '@/lib/mailer';
import { checkRateLimit, sanitizeString } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const reg_no = sanitizeString(body.reg_no, 20);
    const password = body.password?.trim() || '';
    const email = sanitizeString(body.email, 100).toLowerCase();
    const full_name = sanitizeString(body.full_name, 100);

    if (!reg_no || !password || !email || !full_name) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    // Rate limit by email
    const rl = checkRateLimit(`signup:${email}`, 3, 10 * 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many signup attempts. Try again later.' }, { status: 429 });
    }

    // Validate email domain
    if (!email.endsWith('@rgmcet.edu.in')) {
      return NextResponse.json({ error: 'Email must end with @rgmcet.edu.in' }, { status: 400 });
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }
    if (password.length > 128) {
      return NextResponse.json({ error: 'Password is too long' }, { status: 400 });
    }

    // Validate reg_no format
    if (reg_no.length < 4 || reg_no.length > 20) {
      return NextResponse.json({ error: 'Invalid registration number' }, { status: 400 });
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

    // Generate and hash OTP
    const otp = generateOTP();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Store student (unverified)
    const { error: insertError } = await supabaseAdmin
      .from('students')
      .insert({
        reg_no,
        password: hashedPassword,
        email,
        full_name,
        is_verified: false,
        otp: hashedOtp,
        otp_expires_at: otpExpiry,
      });

    if (insertError) {
      console.error('Insert error:', insertError);
      return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
    }

    // Send OTP (send plaintext to email, store hash in DB)
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
