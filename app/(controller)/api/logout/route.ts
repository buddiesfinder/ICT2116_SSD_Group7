import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_BASE_URL || '/'));

  // Clear the session cookie
  response.cookies.set('refresh_token', '', {
    path: '/',
    maxAge: 0,
  });

  return response;
}
