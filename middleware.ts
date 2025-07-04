import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const nonce = generateNonce();
  const response = NextResponse.next();

  response.headers.set(
  'Content-Security-Policy',
  ` default-src 'none';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic';
    style-src 'self';
    img-src 'self' data:;
    connect-src 'self';
    form-action 'self';
    base-uri 'none';
    frame-ancestors 'none';
  `.replace(/\s{2,}/g, ' ').trim()
);

  response.headers.set('x-nonce', nonce); 
  return response;
}

function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Buffer.from(array).toString('base64');
}

export const config = {
  matcher: ["/((?!_next|favicon.ico).*)"], 
};

