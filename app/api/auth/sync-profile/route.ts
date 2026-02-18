import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { verifySession } from '@/lib/auth-cookie';
import { sha256, generateSalt } from "@/lib/hash";

export async function POST(req: Request) {
    try {
        // 1. Verify Authentication (Ensures only the logged-in user can sync)
        const cookie = req.headers.get('cookie');
        // Simple extraction for demo, ideally use a helper that works with Request headers
        const tokenMatch = cookie?.match(/auth_session=([^;]+)/);
        const token = tokenMatch ? tokenMatch[1] : null;

        // Alternative: Use a dedicated header for the intent token if sync happens before full session
        const body = await req.json();
        const { intentToken, userId, companyId, displayName, riskScore, status, biometricProfile, password, phrase } = body;

        const session = intentToken ? await verifySession(intentToken) : (token ? await verifySession(token) : null);

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 2. Validate session matches the data being synced
        if (session.userId !== userId || session.companyId !== companyId) {
            return NextResponse.json({ error: "Forbidden: Identity mismatch" }, { status: 403 });
        }

        // 3. Write to Firestore (Server-Side)
        const userRef = doc(db, "companies", companyId, "users", userId);
        
        // Check if user exists to handle password initialization for new users
        const userSnap = await getDoc(userRef);

        const payload: Record<string, unknown> = {
            id: userId,
            companyId,
            displayName,
            riskScore,
            lastProofStatus: status,
            lastProofTimestamp: serverTimestamp(),
            isOnline: true,
            phrase: null, // Explicitly nullify plaintext phrase for security
        };

        // If it's a new user or missing password, and password/phrase was provided, set it.
        const secretPhrase = password || phrase;
        if (secretPhrase && (!userSnap.exists() || !userSnap.data().phraseHash)) {
            const salt = generateSalt();
            const hash = await sha256(secretPhrase, salt);
            payload.phraseHash = hash;
            payload.salt = salt;
            
            // Format createdAt as ISO string per requirement
            if (!userSnap.exists()) {
                payload.createdAt = new Date().toISOString();
            }
        }

        if (biometricProfile) {
            const isMobile = biometricProfile.holdingAngleMean && biometricProfile.holdingAngleMean > 0;
            if (isMobile) {
                payload.mobileProfile = biometricProfile;
                payload.lastUsedDevice = "MOBILE";
            } else {
                payload.desktopProfile = biometricProfile;
                payload.lastUsedDevice = "DESKTOP";
            }
        }

        await setDoc(userRef, payload, { merge: true });

        // Audit Trail
        const historyRef = doc(db, "companies", companyId, "users", userId, "history", `${Date.now()}`);
        await setDoc(historyRef, {
            timestamp: serverTimestamp(),
            riskScore,
            status,
            deviceType: biometricProfile?.holdingAngleMean > 0 ? "MOBILE" : "DESKTOP"
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Sync Profile API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
