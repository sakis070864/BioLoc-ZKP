import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

// --- SECURITY HARDENING: NO DEFAULT SECRETS ---
const SECRET_STRING = process.env.AUTH_SECRET || process.env.auth_secret;

if (!SECRET_STRING) {
    throw new Error("FATAL: AUTH_SECRET environment variable is not set. Application cannot start securely.");
}

const SECRET_KEY = new TextEncoder().encode(SECRET_STRING);

console.log("--- AUTH DEBUG ---");
console.log("AUTH_SECRET Loaded?", !!SECRET_STRING);
console.log("Algorithm:", "HS256");
console.log("------------------");

const ALG = 'HS256';

export async function createSession(payload: Record<string, unknown>) {
    return await new SignJWT({ ...payload, biometricVerified: true })
        .setProtectedHeader({ alg: ALG })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(SECRET_KEY);
}

export async function createIntentToken(payload: Record<string, unknown>) {
    return await new SignJWT({ ...payload, biometricVerified: false })
        .setProtectedHeader({ alg: ALG })
        .setIssuedAt()
        .setExpirationTime('10m') // Short lived for biometric step
        .sign(SECRET_KEY);
}

export async function verifySession(token: string) {
    try {
        const { payload } = await jwtVerify(token, SECRET_KEY, {
            algorithms: [ALG],
        });
        return payload;
    } catch (error) {
        console.error("JWT Verification Failed:", error);
        return null;
    }
}

export async function setSessionCookie(token: string) {
    const cookieStore = await cookies();
    cookieStore.set('auth_session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60 * 24, // 24 hours
    });
}

export async function deleteSessionCookie() {
    const cookieStore = await cookies();
    cookieStore.delete('auth_session');
}

export async function getSession() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_session')?.value;
    if (!token) return null;
    return await verifySession(token);
}
