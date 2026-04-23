import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

// DELETE - Delete a reference (only the publisher or admins)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const studentToken = request.cookies.get('student_token')?.value;
  const adminToken = request.cookies.get('admin_token')?.value;
  const token = studentToken || adminToken;

  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

  // Get reference
  const { data: ref } = await supabaseAdmin
    .from('references_posts')
    .select('posted_by_id')
    .eq('id', params.id)
    .single();

  if (!ref) return NextResponse.json({ error: 'Reference not found' }, { status: 404 });

  // Only publisher or admins can delete
  const isPublisher = ref.posted_by_id === payload.id;
  const isAdmin = payload.role === 'admin' || payload.role === 'superadmin';

  if (!isPublisher && !isAdmin) {
    return NextResponse.json({ error: 'Not authorized to delete this reference' }, { status: 403 });
  }

  const { error } = await supabaseAdmin
    .from('references_posts')
    .delete()
    .eq('id', params.id);

  if (error) {
    return NextResponse.json({ error: 'Failed to delete reference' }, { status: 500 });
  }

  return NextResponse.json({ message: 'Reference deleted' });
}
