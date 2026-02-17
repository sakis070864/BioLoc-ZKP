import { NextResponse } from 'next/server';
import { createSession } from '@/lib/auth-cookie';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { companyId } = body;

        if (!companyId) {
            return NextResponse.json({ error: "Missing companyId" }, { status: 400 });
        }

        // Create a shorter-lived token specifically for this link?
        // Reuse createSession but maybe add a specific 'type' claim if we want to distinguish later.
        // For now, a standard session token is fine, as it will be exchanged for a cookie.
        // We might want to set a shorter expiration if it's just a link, but 24h is the default in createSession.

        const token = await createSession({
            companyId,
            role: 'admin-link',
            type: 'magic-link',
            isTemporary: true
        });

        // Construct the access URL
        const origin = new URL(req.url).origin;
        const accessUrl = `${origin}/api/auth/access?token=${token}`;

        return NextResponse.json({ url: accessUrl });

    } catch (error) {
        console.error("Link Gen Error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
