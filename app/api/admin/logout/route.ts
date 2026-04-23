import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ message: 'Logged out' });
  response.cookies.delete('admin_token');
  response.cookies.delete('student_token');
  return response;
}
