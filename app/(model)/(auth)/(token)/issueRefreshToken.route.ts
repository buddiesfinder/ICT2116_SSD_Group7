// app/api/login/route.ts
import { NextResponse }    from 'next/server'
import { serialize }       from 'cookie'
import { SecondLoginFactor } from '@/lib/auth/SecondLoginFactor'

export async function POST(request: Request) {
  const { userId, otp } = await request.json()

  // 1) Perform your 2FA check & get back the token+role
  const result = await SecondLoginFactor(userId, otp)
  if (!result.success || !result.token) {
    return NextResponse.json(
      { success: false, message: result.message },
      { status: 401 }
    )
  }

  // 2) Create a locked-down cookie
  const cookie = serialize('refresh_token', result.token, {
    httpOnly:  true,
    secure:    process.env.NODE_ENV === 'production',
    sameSite:  'Strict',
    path:      '/',               // only send for your app’s routes
    domain:    'danlee.site',     // lock to your domain
    maxAge:    7 * 24 * 60 * 60,  // 7 days in seconds
  })

  // 3) Return success and set the cookie
  const res = NextResponse.json({
    success: true,
    message: 'Second factor passed, cookie set',
    userId:  result.userId,
    role:    result.role
  })
  res.headers.set('Set-Cookie', cookie)
  return res
}
