import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabase';
import { signToken } from '@/lib/auth';
import { checkRateLimit, resetRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = (body.email || '').trim().toLowerCase();
    const password = (body.password || '').trim();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Rate limit by email
    const rl = checkRateLimit(`admin-login:${email}`, 5, 15 * 60 * 1000);
    if (!rl.allowed) {
      const mins = Math.ceil(rl.retryAfterMs / 60000);
      return NextResponse.json({ error: `Too many login attempts. Try again in ${mins} minute(s).` }, { status: 429 });
    }

    // Find admin
    const { data: admin, error } = await supabaseAdmin
      .from('admins')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !admin) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Reset rate limit on success
    resetRateLimit(`admin-login:${email}`);

    const token = await signToken({
      id: admin.id,
      email: admin.email,
      role: admin.is_super ? 'superadmin' : 'admin',
      name: admin.full_name,
    });

    const response = NextResponse.json({
      message: 'Login successful',
      user: { id: admin.id, email: admin.email, name: admin.full_name, is_super: admin.is_super },
    });

    response.cookies.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
