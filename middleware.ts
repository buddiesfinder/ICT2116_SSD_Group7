import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const nonce = generateNonce();
  const response = NextResponse.next();

  response.headers.set(
    'Content-Security-Policy',
    `
      default-src 'none';
      script-src 'self' 'nonce-${nonce}' https://www.google.com https://www.gstatic.com;
      style-src 'self' https://www.gstatic.com;
      frame-src https://www.google.com;
      connect-src 'self' https://www.google.com;
      img-src 'self' https://www.gstatic.com data:;
      base-uri 'none';
      frame-ancestors 'none';
      form-action 'self';
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

