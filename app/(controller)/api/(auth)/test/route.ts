import { NextRequest, NextResponse } from 'next/server';
import { verifyJwt } from '@/lib/jwt';
import { verify } from 'crypto';

export async function GET(request: NextRequest) {

    const token = request.cookies.get('refresh_token')?.value;
    const decoded = verifyJwt(token as string, process.env.JWT_SECRET as string);
    console.log(decoded);
    return NextResponse.json({ success: true, message: 'hello' }, { status: 200 });

    
 }