import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { sanitizeSearch, sanitizeString, isValidUrl } from '@/lib/rate-limit';

// GET - List all references
export async function GET(request: NextRequest) {
  const studentToken = request.cookies.get('student_token')?.value;
  const adminToken = request.cookies.get('admin_token')?.value;
  const token = studentToken || adminToken;

  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search');
  const sort = searchParams.get('sort') || 'latest';

  let query = supabaseAdmin.from('references_posts').select('*');

  if (search) {
    const sanitized = sanitizeSearch(search);
    if (sanitized) {
      // Use separate ilike calls to avoid PostgREST filter injection
      query = query.or(`title.ilike.%${sanitized}%,subject.ilike.%${sanitized}%,description.ilike.%${sanitized}%`);
    }
  }

  if (sort === 'latest') {
    query = query.order('created_at', { ascending: false });
  } else {
    query = query.order('created_at', { ascending: true });
  }

  const { data: refs, error } = await query;

  if (error) {
    console.error('Fetch refs error:', error);
    return NextResponse.json({ error: 'Failed to fetch references' }, { status: 500 });
  }

  return NextResponse.json({
    references: refs || [],
    current_user_id: payload.id,
    current_user_role: payload.role,
  });
}

// POST - Add a new reference
export async function POST(request: NextRequest) {
  const studentToken = request.cookies.get('student_token')?.value;
  const adminToken = request.cookies.get('admin_token')?.value;
  const token = studentToken || adminToken;

  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

  try {
    const body = await request.json();
    const title = sanitizeString(body.title, 200);
    const description = sanitizeString(body.description, 2000);
    const url = sanitizeString(body.url, 2000);
    const subject = sanitizeString(body.subject, 100);

    if (!title || !url || !subject) {
      return NextResponse.json({ error: 'Title, URL, and subject are required' }, { status: 400 });
    }

    // Validate URL format
    if (!isValidUrl(url)) {
      return NextResponse.json({ error: 'URL must start with http:// or https://' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('references_posts')
      .insert({
        title,
        description,
        url,
        subject,
        posted_by_id: payload.id,
        posted_by_name: payload.name || payload.email,
        posted_by_role: payload.role,
      });

    if (error) {
      console.error('Insert ref error:', error);
      return NextResponse.json({ error: 'Failed to add reference' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Reference added successfully' });
  } catch (error) {
    console.error('Add ref error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
