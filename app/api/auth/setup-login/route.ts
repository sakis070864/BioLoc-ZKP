import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { createSession } from '@/lib/auth-cookie';

export async function POST(req: Request) {
    try {
        const { companyId } = await req.json();

        if (!companyId) {
            return NextResponse.json({ error: "Missing companyId" }, { status: 400 });
        }

        // 1. Verify Company Exists
        const companyRef = doc(db, 'companies', companyId);
        const companySnap = await getDoc(companyRef);

        if (!companySnap.exists()) {
            return NextResponse.json({ error: "Invalid Company ID" }, { status: 404 });
        }

        // 2. Create Session
        const sessionPayload = {
            companyId,
            userId: 'setup_admin',
            role: 'admin',
            biometricVerified: true
        };

        const token = await createSession(sessionPayload);

        // 3. Set cookie directly on the response object.
        // setSessionCookie() uses cookies().set() which can be unreliable in route handlers.
        // Using response.cookies.set() guarantees the Set-Cookie header is always sent.
        const response = NextResponse.json({ success: true, token });
        response.cookies.set('auth_session', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
            maxAge: 60 * 60 * 24, // 24 hours
        });

        return response;

    } catch (error) {
        console.error("Setup Login Error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
