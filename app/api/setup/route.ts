import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabase';

// GET - Health check (no auth required)
export async function GET() {
  try {
    const { error } = await supabaseAdmin.from('students').select('id').limit(1);
    if (error) {
      return NextResponse.json({ status: 'error', message: 'Database not ready', error: error.message }, { status: 503 });
    }
    return NextResponse.json({ status: 'ok', message: 'EduTech API is running' });
  } catch {
    return NextResponse.json({ status: 'error', message: 'Database connection failed' }, { status: 503 });
  }
}

// POST - Setup database & seed super admin (protected by env key)
export async function POST(request: NextRequest) {
  // Protect setup with env key in production
  const setupKey = process.env.SETUP_KEY;
  if (setupKey) {
    const { searchParams } = new URL(request.url);
    const providedKey = searchParams.get('key');
    if (providedKey !== setupKey) {
      return NextResponse.json({ error: 'Invalid setup key' }, { status: 403 });
    }
  }

  const results: string[] = [];
  const errors: string[] = [];

  // Step 1: Test connection
  try {
    const { error: testError } = await supabaseAdmin.from('students').select('id').limit(1);
    if (testError && testError.message.includes('does not exist')) {
      errors.push('Tables do not exist yet. Please run the SQL migration in Supabase SQL Editor first. See /supabase/migration.sql');
      return NextResponse.json({ results, errors, setup_complete: false }, { status: 400 });
    }
    results.push('✅ Database connection OK - tables exist');
  } catch (e) {
    errors.push(`Database connection failed: ${e}`);
    return NextResponse.json({ results, errors, setup_complete: false }, { status: 500 });
  }

  // Step 2: Seed super admin
  const email = process.env.SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_PASSWORD;

  if (!email || !password) {
    errors.push('SUPER_ADMIN_EMAIL or SUPER_ADMIN_PASSWORD not set in .env.local');
    return NextResponse.json({ results, errors, setup_complete: false }, { status: 500 });
  }

  try {
    const { data: existing } = await supabaseAdmin
      .from('admins')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      results.push(`✅ Super admin already exists: ${email}`);
    } else {
      const hashedPassword = await bcrypt.hash(password, 12);
      const { error: insertError } = await supabaseAdmin
        .from('admins')
        .insert({
          email,
          password: hashedPassword,
          full_name: 'Super Admin',
          is_super: true,
        });

      if (insertError) {
        errors.push(`Failed to seed super admin: ${insertError.message}`);
      } else {
        results.push(`✅ Super admin created: ${email}`);
      }
    }
  } catch (e) {
    errors.push(`Super admin seed error: ${e}`);
  }

  // Step 3: Verify all tables
  const tables = ['students', 'admins', 'quizzes', 'quiz_questions', 'quiz_attempts', 'references_posts'];
  for (const table of tables) {
    try {
      const { error } = await supabaseAdmin.from(table).select('id').limit(1);
      if (error) {
        errors.push(`❌ Table "${table}": ${error.message}`);
      } else {
        results.push(`✅ Table "${table}" is ready`);
      }
    } catch (e) {
      errors.push(`❌ Table "${table}" check failed: ${e}`);
    }
  }

  return NextResponse.json({
    results,
    errors,
    setup_complete: errors.length === 0,
    message: errors.length === 0
      ? '🎉 Setup complete! All tables ready, super admin seeded.'
      : '⚠️ Setup completed with some issues.',
  });
}
