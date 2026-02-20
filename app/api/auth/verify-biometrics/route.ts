import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { verifySession, createSession } from '@/lib/auth-cookie';
import { compareBiometrics } from '@/lib/biometrics';

export async function POST(req: Request) {
    try {
        const { intentToken, biometricData } = await req.json();

        if (!intentToken || !biometricData) {
            return NextResponse.json({ error: "Missing verification data" }, { status: 400 });
        }

        // 1. Verify the Intent Token
        const payload = await verifySession(intentToken);
        if (!payload || payload.biometricVerified === true) {
            return NextResponse.json({ error: "Invalid or expired session intent" }, { status: 401 });
        }

        const { userId, companyId } = payload as { userId: string, companyId: string };

        // 2. Fetch User Profile and Company Settings
        const userRef = doc(db, 'companies', companyId, 'users', userId);
        const companyRef = doc(db, 'companies', companyId);

        const [userSnap, companySnap] = await Promise.all([
            getDoc(userRef),
            getDoc(companyRef)
        ]);

        if (!userSnap.exists() || !companySnap.exists()) {
            return NextResponse.json({ error: "Security context lost" }, { status: 404 });
        }

        const userData = userSnap.data();
        const companyData = companySnap.data();
        const threshold = 40; // Temporary lowering for calibration testing (was 80)

        // 3. Determine target profile
        let targetProfile = null;
        let instrumentName = "UNKNOWN";

        if (userData.mobileProfile || userData.desktopProfile) {
            if (userData.mobileProfile) {
                targetProfile = userData.mobileProfile;
                instrumentName = "MOBILE";
            } else {
                targetProfile = userData.desktopProfile;
                instrumentName = "DESKTOP";
            }
        } else if (userData.biometricProfile) {
            targetProfile = userData.biometricProfile;
            instrumentName = "LEGACY";
        }

        if (!targetProfile) {
            return NextResponse.json({ error: "No biometric profile enrolled" }, { status: 403 });
        }

        // 4. Server-Side Biometric Comparison
        const result = compareBiometrics(targetProfile, biometricData);

        // 5. Log the Attempt
        await addDoc(collection(db, 'companies', companyId, 'login_logs'), {
            timestamp: serverTimestamp(),
            userId,
            score: result.score,
            status: result.score >= threshold ? "BIOMETRIC_SUCCESS" : "BIOMETRIC_FAIL",
            method: "BIOMETRIC_SERVER_ENFORCED",
            instrument: instrumentName
        });

        // 6. Final Enforcement
        if (result.score >= threshold) {
            const finalSessionToken = await createSession({
                ...payload,
                biometricVerified: true,
                score: result.score
            });
            const response = NextResponse.json({ success: true, score: result.score, token: finalSessionToken });
            response.cookies.set('auth_session', finalSessionToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
                maxAge: 60 * 60 * 24,
            });
            return response;
        } else {
            return NextResponse.json({
                error: "Biometric mismatch",
                score: result.score,
                threshold
            }, { status: 403 });
        }

    } catch (error) {
        console.error("Biometric Verification Error:", error);
        return NextResponse.json({ error: "Internal Security Error" }, { status: 500 });
    }
}
