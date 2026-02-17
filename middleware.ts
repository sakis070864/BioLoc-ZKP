import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifySession } from '@/lib/auth-cookie'

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl
    const secretRoute = (process.env.ADMIN_ROUTE || 'nexus-control').replace(/^\//, '');
    const legacyRoute = 'Sakis@1964';

    // 1. Handle Secret Route Rewriting (Bypass biometric check for Admin)
    let isSecretRoute = false;
    if (pathname.startsWith(`/${secretRoute}`)) {
        isSecretRoute = true;
        return NextResponse.rewrite(new URL('/nexus-control', request.url));
    } else if (pathname.startsWith(`/${legacyRoute}`)) {
        isSecretRoute = true;
        return NextResponse.rewrite(new URL('/nexus-control', request.url));
    }

    // --- 2. PROTECT DASHBOARD ---
    if (pathname.startsWith('/dashboard')) {
        // ALLOW access if setup_company_id is present (First-time setup)
        if (request.nextUrl.searchParams.has('setup_company_id')) {
            return NextResponse.next();
        }

        const cookie = request.cookies.get('auth_session')?.value;
        const session = cookie ? await verifySession(cookie) : null;

        // Force biometric verification check
        if (!session || session.biometricVerified !== true) {
            // Redirect to secure login if no valid session or biometrics not verified
            const loginUrl = request.nextUrl.clone();
            loginUrl.pathname = '/secure-login';
            return NextResponse.redirect(loginUrl);
        }
    }

    // --- 3. EXISTING ADMIN PROTECTION ---
    // BLOCK /admin (Always block direct access)
    if (pathname === '/admin') {
        return NextResponse.rewrite(new URL('/404', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/admin/:path*',
        '/:path*' // We need to match everything to check for the secret route rewriting
    ],
}
