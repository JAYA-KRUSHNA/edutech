import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST() {
  const results: string[] = [];
  const errors: string[] = [];

  // Step 1: Test connection by trying to query students
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
