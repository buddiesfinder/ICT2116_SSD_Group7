// middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose';

async function isTokenValid(token: string): Promise<boolean> {
  try {
    const secret = new TextEncoder().encode(process.env.REFRESH_JWT!);
    await jwtVerify(token, secret); // will throw if invalid/expired
    return true;
  } catch (err) {
   
    return false;
  }
}

// 1) Generate a 16-byte nonce using the Web Crypto API
function generateNonce(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)             // globalThis.crypto is Edge-safe
  let str = ''
  for (const byte of array) {
    str += String.fromCharCode(byte)
  }
  return btoa(str)                          // base64-encode via browser btoa
}

export async function middleware(request: NextRequest) {

  const pathname = request.nextUrl.pathname;
  const token = request.cookies.get('refresh_token')?.value;
  
  const authPages = [
    '/login',
    '/register',
    '/verify-otp',
    '/forgot_issue_otp',
    '/forgot_reset_password',
  ];

  if (token) {
    const valid = await isTokenValid(token);

    if (authPages.includes(pathname) && valid) {
      return NextResponse.redirect(new URL('/event', request.url));
    }
  }


  // 2) Create the nonce and the response object
  const nonce = generateNonce()
  const response = NextResponse.next()

  // 3) Set your CSP header with the generated nonce
  response.headers.set(
    'Content-Security-Policy',
    `
      default-src 'none';
      script-src 'self' 'nonce-${nonce}' https://www.google.com https://www.gstatic.com;
      style-src 'self' https://www.gstatic.com;
      frame-src https://www.google.com;
      connect-src 'self' https://www.google.com;
      img-src 'self' blob: https://www.gstatic.com data:;
      base-uri 'none';
      frame-ancestors 'none';
      form-action 'self';
    `.replace(/\s+/g, ' ').trim()
  )

  // 4) Expose the nonce via a custom header if you need it in your page JS
  response.headers.set('x-nonce', nonce)
  

  return response
}

export const config = {
  // 5) Apply to all routes except Next.js internals
  matcher: [
    '/login',
    '/register',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}

