import { NextRequest, NextResponse } from 'next/server';
import { verifyJwt } from '@/lib/jwt';

export async function POST(request: NextRequest) {
    try {
        // Check refresh token
        const refreshToken = request.cookies.get('refresh_token')?.value;
        
        if (!refreshToken) {
        return NextResponse.json({ success: false, message: 'Missing refresh token' }, { status: 401 });
        }   

        let payload: any;
        try {
        const payload = verifyJwt(refreshToken as string, process.env.REFRESH_JWT as string);
        } catch (err) {
        return NextResponse.json({ success: false, message: 'Invalid refresh token' }, { status: 403 });
        }

        // Check Session in Refresh Token's Payload
        console.log("Payload", payload);

            
    }catch (error) {

    }
} 