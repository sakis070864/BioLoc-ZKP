import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { createSession, setSessionCookie } from '@/lib/auth-cookie';

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
        // We grant 'admin' role for this company context
        const sessionPayload = {
            companyId,
            userId: 'setup_admin',
            role: 'admin',
            biometricVerified: true // Trust the setup link as a verified entry point
        };

        const token = await createSession(sessionPayload);

        // 3. Set Cookie
        await setSessionCookie(token);

        return NextResponse.json({ success: true, token });

    } catch (error) {
        console.error("Setup Login Error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
