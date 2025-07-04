// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import crypto from 'crypto';

export function middleware(request: NextRequest) {
  // ✅ 1. Generate a per-request random nonce
  const nonce = crypto.randomBytes(16).toString('base64');

  // ✅ 2. Pass the nonce via request header so layout.tsx can access it
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);

  // ✅ 3. Forward the request with modified headers
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // ✅ 4. Inject CSP header with the nonce
  const csp = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}';
    style-src 'self' 'unsafe-inline';
    object-src 'none';
    base-uri 'self';
    frame-ancestors 'none';
  `.replace(/\s{2,}/g, ' ').trim();

  response.headers.set('Content-Security-Policy', csp);

  return response;
}

export const config = {
  matcher: ['/((?!_next|favicon.ico|.*\\..*).*)'], // ✅ Run on all HTML routes, not static files
};
