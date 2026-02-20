import { NextResponse } from 'next/server';
import { jwtVerify, SignJWT } from 'jose';

const secretEnv = process.env.ADMIN_ROUTE;
if (!secretEnv) {
    throw new Error("CRITICAL SECURITY ERROR: ADMIN_ROUTE environment variable is not set.");
}
const SECRET_KEY = new TextEncoder().encode(secretEnv);

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
        return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }

    try {
        // 1. Verify Magic Link Token
        await jwtVerify(token, SECRET_KEY);

        // 2. Create Session Token (Longer lived)
        const sessionToken = await new SignJWT({ role: 'admin' })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('24h') // Session valid for 24 hours
            .sign(SECRET_KEY);

        // 3. Set Cookie and Redirect
        const response = NextResponse.redirect(new URL('/nexus-control?unlocked=true', req.url));

        response.cookies.set('admin_session', sessionToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24, // 24 hours
            path: '/',
        });

        return response;

    } catch (error) {
        console.error("Token verification failed:", error);
        return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }
}
