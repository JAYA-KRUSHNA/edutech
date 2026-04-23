import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabase';

// One-time seed for super admin
export async function POST() {
  try {
    const email = process.env.SUPER_ADMIN_EMAIL;
    const password = process.env.SUPER_ADMIN_PASSWORD;

    if (!email || !password) {
      return NextResponse.json({ error: 'Super admin env vars not set' }, { status: 500 });
    }

    // Check if already exists
    const { data: existing } = await supabaseAdmin
      .from('admins')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      return NextResponse.json({ message: 'Super admin already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const { error } = await supabaseAdmin
      .from('admins')
      .insert({
        email,
        password: hashedPassword,
        full_name: 'Super Admin',
        is_super: true,
      });

    if (error) {
      console.error('Seed error:', error);
      return NextResponse.json({ error: 'Failed to seed super admin' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Super admin seeded successfully' });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
