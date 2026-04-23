import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

// DELETE - Delete admin (super admin only, cannot delete self)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const token = request.cookies.get('admin_token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload || payload.role !== 'superadmin') {
    return NextResponse.json({ error: 'Only super admins can delete admins' }, { status: 403 });
  }

  // Prevent deleting yourself
  if (payload.id === params.id) {
    return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
  }

  // Prevent deleting other super admins
  const { data: targetAdmin } = await supabaseAdmin
    .from('admins')
    .select('is_super')
    .eq('id', params.id)
    .single();

  if (targetAdmin?.is_super) {
    return NextResponse.json({ error: 'Cannot delete a super admin' }, { status: 403 });
  }

  const { error } = await supabaseAdmin
    .from('admins')
    .delete()
    .eq('id', params.id);

  if (error) {
    return NextResponse.json({ error: 'Failed to delete admin' }, { status: 500 });
  }

  return NextResponse.json({ message: 'Admin deleted successfully' });
}
