import { NextRequest, NextResponse } from 'next/server';

export function middleware(_request: NextRequest) {
  const response = NextResponse.next();

  response.headers.set(
    'Content-Security-Policy',
    `
    default-src 'self';
    script-src 'self' https:;
    style-src 'self' 'unsafe-inline' https:;
    img-src 'self' data: https:;
    font-src 'self';
    connect-src 'self' https: wss:;
    object-src 'none';
    base-uri 'none';
    frame-ancestors 'none';
    `.replace(/\s{2,}/g, ' ').trim()
  );

  return response;
}
