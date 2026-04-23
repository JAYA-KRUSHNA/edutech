import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret');

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Student protected routes
  if (pathname.startsWith('/student/dashboard')) {
    const token = request.cookies.get('student_token')?.value;
    if (!token) {
      return NextResponse.redirect(new URL('/student/login', request.url));
    }
    try {
      await jwtVerify(token, JWT_SECRET);
      return NextResponse.next();
    } catch {
      const response = NextResponse.redirect(new URL('/student/login', request.url));
      response.cookies.delete('student_token');
      return response;
    }
  }

  // Admin protected routes
  if (pathname.startsWith('/admin/dashboard')) {
    const token = request.cookies.get('admin_token')?.value;
    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    try {
      await jwtVerify(token, JWT_SECRET);
      return NextResponse.next();
    } catch {
      const response = NextResponse.redirect(new URL('/admin/login', request.url));
      response.cookies.delete('admin_token');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/student/dashboard/:path*', '/admin/dashboard/:path*'],
};
