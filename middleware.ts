import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export function middleware(request: NextRequest) {
  // Generate a secure nonce
  const nonce = crypto.randomBytes(16).toString('base64');

  // Prepare a CSP using the nonce
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}';
    style-src 'self' 'unsafe-inline';
    img-src 'self' data:;
    font-src 'self';
    connect-src 'self' https: wss:;
    object-src 'none';
    base-uri 'none';
    frame-ancestors 'none';
  `.replace(/\s{2,}/g, ' ').trim();

  const response = NextResponse.next();
  response.headers.set('Content-Security-Policy', cspHeader);
  response.headers.set('x-nonce', nonce); // optional: you can use this in layout.tsx if needed

  return response;
}
