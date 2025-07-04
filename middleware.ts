import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export function middleware(req: NextRequest) {
  // Generate a secure nonce for this request
  const nonce = crypto.randomBytes(16).toString('base64');

  // Build a secure CSP header using the nonce
  const csp = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' https://cdn.jsdelivr.net https:;
    style-src 'self' 'unsafe-inline' https:;
    img-src 'self' data: https:;
    font-src 'self' https:;
    connect-src 'self' https: wss:;
    object-src 'none';
    base-uri 'none';
    frame-ancestors 'none';
  `.replace(/\s{2,}/g, ' ').trim();

  // Inject CSP and nonce into response headers
  const res = NextResponse.next();
  res.headers.set('Content-Security-Policy', csp);
  res.headers.set('x-nonce', nonce); // optional: can use in your layout.tsx

  return res;
}
