// middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { serialize }                 from 'cookie'
import { verifyJwt }                 from '@/lib/jwt'    // your HMAC-verify helper


// 1) Define which paths require admin
const ADMIN_UI_PATH = '/admin'
const ADMIN_API_PREFIX = '/api/admin'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 2) If this is an admin route, validate the JWT and role
  if (
    pathname === ADMIN_UI_PATH ||
    pathname.startsWith(ADMIN_API_PREFIX)
  ) {
    const token = request.cookies.get('refresh_token')?.value
    if (!token) {
      // no token → redirect to login
      return NextResponse.redirect(new URL('/login', request.url))
    }

    let payload: any
    try {
      payload = verifyJwt(
        token,
        process.env.REFRESH_JWT as string,
        { algorithms: ['HS256'] }
      )
    } catch {
      // invalid signature / expired / wrong alg
      return NextResponse.redirect(new URL('/login', request.url))
    }

    if (payload.role !== 'admin') {
      // logged in but not admin
      return NextResponse.redirect(new URL('/', request.url))
    }
    // else: we’re good—fall through to apply CSP and continue
  }

  // 3) Generate a CSP nonce for **all** pages
  const nonce = crypto.randomBytes(16).toString('base64')
  const response = NextResponse.next()

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
  )
  response.headers.set('x-nonce', nonce)

  return response
}

export const config = {
  matcher: [
    // Apply middleware to everything except _next/static, favicon, etc.
    '/((?!_next/static|_next/image|favicon.ico).*)'
  ]
}
