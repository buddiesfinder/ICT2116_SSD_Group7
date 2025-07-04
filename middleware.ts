import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export function middleware(_req: NextRequest) {
  const nonce = crypto.randomBytes(16).toString('base64');

  const csp = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' https://cdn.jsdelivr.net https:`,
    `style-src 'self' https:`,
    `img-src 'self' data: https:`,
    `font-src 'self' https:`,
    `connect-src 'self' https: wss:`,
    `object-src 'none'`,
    `base-uri 'none'`,
    `frame-ancestors 'none'`
  ].join('; ');

  const res = NextResponse.next();
  res.headers.set('Content-Security-Policy', csp);
  res.headers.set('x-nonce', nonce);
  return res;
}
