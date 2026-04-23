import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const payload = await verifyToken(token);
  if (!payload || (payload.role !== 'admin' && payload.role !== 'superadmin')) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const { data: admin } = await supabaseAdmin
    .from('admins')
    .select('id, email, full_name, is_super, created_at')
    .eq('id', payload.id)
    .single();

  if (!admin) {
    return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
  }

  return NextResponse.json({ user: { ...admin, role: admin.is_super ? 'superadmin' : 'admin' } });
}
