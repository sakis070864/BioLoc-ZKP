import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth-cookie';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
        return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    const payload = await verifySession(token);

    if (!payload || !payload.companyId) {
        return NextResponse.json({ error: "Invalid or Expired Token" }, { status: 401 });
    }

    // Redirect to Dashboard with setup param
    const destination = new URL('/dashboard', req.url);
    destination.searchParams.set('setup_company_id', payload.companyId as string);

    const response = NextResponse.redirect(destination);

    // Set cookie directly on the redirect response.
    // cookies().set() from next/headers does not work in GET route handlers in Next.js 14+,
    // so we must set the cookie on the response object instead.
    response.cookies.set('auth_session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
}
