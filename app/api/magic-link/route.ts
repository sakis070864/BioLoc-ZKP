import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getSession } from '@/lib/auth-cookie';
import { generateMagicLink } from '@/lib/link-generator';

export async function POST(req: Request) {
    try {
        // --- SECURITY: Session Verification ---
        // --- SECURITY: Session Verification ---
        // 1. Try User Session
        let session = await getSession();

        // 2. Fallback: Try Admin Session (if coming from Nexus Control)
        if (!session) {
            const cookieStore = await import('next/headers').then(mod => mod.cookies());
            const adminToken = cookieStore.get('admin_session')?.value;

            if (adminToken) {
                try {
                    const secretEnv = process.env.ADMIN_ROUTE;
                    if (secretEnv) {
                        const adminKey = new TextEncoder().encode(secretEnv);
                        const { payload } = await import('jose').then(mod => mod.jwtVerify(adminToken, adminKey));
                        if (payload) {
                            // Valid Admin - Create a mock session to proceed
                            session = {
                                companyId: 'ADMIN_OVERRIDE',
                                userId: 'admin',
                                role: 'admin',
                                biometricVerified: true
                            };
                        }
                    }
                } catch (e) {
                    console.log("Admin session invalid:", e);
                }
            }
        }

        if (!session) {
            return NextResponse.json({ error: "Unauthorized: Admin session required" }, { status: 401 });
        }

        const { companyId, name, id, origin } = await req.json();

        if (!companyId || !name || !id) {
            return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
        }

        // Generate a secure, random token
        const tokenArray = new Uint8Array(32);
        crypto.getRandomValues(tokenArray);
        const token = Array.from(tokenArray).map(b => b.toString(16).padStart(2, '0')).join('');

        // Expiration: 24 hours
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        // Store the magic link token in Firestore
        await addDoc(collection(db, "magic_links"), {
            token,
            companyId,
            name,
            employeeId: id,
            expiresAt,
            createdAt: serverTimestamp(),
            active: true
        });

        // Construct the Magic Link using public domain from environment
        // This ensures links work in Docker, self-hosted, and cloud environments
        // We now accept an origin from the client to support dynamic ports (e.g. 3003)
        const magicLink = generateMagicLink(token, origin);

        return NextResponse.json({ magicLink, token });

    } catch (error) {
        console.error("Magic Link Generation Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
