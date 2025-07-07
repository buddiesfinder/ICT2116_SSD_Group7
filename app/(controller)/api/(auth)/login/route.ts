// anything in api folder is treated as an API route
// and will be served at /api/login
//backend code
import { NextRequest, NextResponse } from 'next/server';
import { serialize }       from 'cookie';
import { FirstLoginFactor } from '@/app/(model)/(auth)/(login)/1FALogin.route';

export async function POST(request: NextRequest) {
  try {
    
    const body = await request.json();
    const { email, password, recaptchaToken } = body;

    // Basic validation
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' }, 
        { status: 400 }
      );
    }

    // Simple email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Call the login handler
    const result = await FirstLoginFactor(email, password, recaptchaToken);

if (!result.success) {
  return NextResponse.json(
    { success: false, message: result.message, requireRecaptcha: result.requireRecaptcha ?? false },
    { status: 401 }
  );
}

// 1) SignJwt already ran inside FirstLoginFactor, which now returns `result.token`
const token = result.token!;

// 2) Serialize into a locked-down cookie
const cookie = serialize('refresh_token', token, {
  httpOnly: true,                         // 🚫 JS can’t read/write
  secure:   process.env.NODE_ENV === 'production',
  sameSite: 'strict',                     // 🚫 CSRF
  domain:   'danlee.site',                // ◀︎ lock to your domain
  path:     '/',                          // ◀︎ only for your app
  maxAge:   7 * 24 * 60 * 60,             // 7 days (seconds)
});

// 3) Return only status + Set-Cookie header
const res = NextResponse.json({
  success: true,
  message: 'Login successful, cookie set',
  userId:  result.userId,
});
res.headers.set('Set-Cookie', cookie);
return res;


  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error processing login' },
      { status: 500 }
    );
  }
}
