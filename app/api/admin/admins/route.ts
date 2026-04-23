import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { verifyToken } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { isValidEmail, sanitizeString } from '@/lib/rate-limit';

// GET - List admins (super admin only)
export async function GET(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload || payload.role !== 'superadmin') {
    return NextResponse.json({ error: 'Only super admins can view admin list' }, { status: 403 });
  }

  const { data: admins } = await supabaseAdmin
    .from('admins')
    .select('id, email, full_name, is_super, created_at')
    .order('created_at', { ascending: false });

  return NextResponse.json({ admins: admins || [] });
}

// POST - Add new admin (super admin only)
export async function POST(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload || payload.role !== 'superadmin') {
    return NextResponse.json({ error: 'Only super admins can add admins' }, { status: 403 });
  }

  const body = await request.json();
  const email = sanitizeString(body.email, 100).toLowerCase();
  const password = (body.password || '').trim();
  const full_name = sanitizeString(body.full_name, 100);

  if (!email || !password || !full_name) {
    return NextResponse.json({ error: 'Email, password, and full name are required' }, { status: 400 });
  }

  // Validate email format
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
  }

  // Validate password strength
  if (password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
  }
  if (password.length > 128) {
    return NextResponse.json({ error: 'Password is too long' }, { status: 400 });
  }

  // Validate name
  if (full_name.length < 2) {
    return NextResponse.json({ error: 'Full name must be at least 2 characters' }, { status: 400 });
  }

  // Check if admin exists
  const { data: existing } = await supabaseAdmin
    .from('admins')
    .select('id')
    .eq('email', email)
    .single();

  if (existing) {
    return NextResponse.json({ error: 'Admin with this email already exists' }, { status: 409 });
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const { error } = await supabaseAdmin
    .from('admins')
    .insert({ email, password: hashedPassword, full_name, is_super: false });

  if (error) {
    return NextResponse.json({ error: 'Failed to create admin' }, { status: 500 });
  }

  return NextResponse.json({ message: 'Admin created successfully' });
}
