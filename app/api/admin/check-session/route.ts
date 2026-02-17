import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode(process.env.ADMIN_ROUTE || 'default-secret-key-change-this');

export async function GET(req: Request) {
    const cookie = req.headers.get('cookie');
    // Extract admin_session manually or via NextRequest
    // Using simple iteration for clarity
    let token = null;

    if (cookie) {
        const parts = cookie.split(';');
        for (const part of parts) {
            const [name, value] = part.trim().split('=');
            if (name === 'admin_session') {
                token = value;
                break;
            }
        }
    }

    if (!token) {
        return NextResponse.json({ unlocked: false });
    }

    try {
        await jwtVerify(token, SECRET_KEY);
        return NextResponse.json({ unlocked: true });
    } catch {
        return NextResponse.json({ unlocked: false });
    }
}
