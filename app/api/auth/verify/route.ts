import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { zkp } from '@/lib/zkp';

export async function POST(req: Request) {
    try {
        const { commitment, proof, nonce } = await req.json();

        if (!nonce || !commitment || !proof) {
            return NextResponse.json({ error: "Missing protocol parameters" }, { status: 400 });
        }

        // 1. Verify Nonce Validation (Replay Protection)
        const challengeRef = doc(db, 'auth_challenges', nonce);
        const challengeSnap = await getDoc(challengeRef);

        if (!challengeSnap.exists()) {
            // Fails if nonce was never issued or already deleted
            console.warn(`🚨 SECURITY ALERT: Invalid Nonce Attempt (${nonce})`);
            return NextResponse.json({ error: "Invalid security challenge" }, { status: 403 });
        }

        const data = challengeSnap.data();

        if (data.status === "USED") {
            console.error(`🚨 SECURITY CRITICAL: Replay Attack Detected with Nonce (${nonce})`);
            return NextResponse.json({ error: "REPLAY DETECTED: This session is expired." }, { status: 403 });
        }

        // 2. Mark Nonce as USED immediately (Prevent Race Conditions)
        await updateDoc(challengeRef, {
            status: "USED",
            usedAt: serverTimestamp(),
            verifiedCommitment: commitment
        });

        // 3. Verify Zero-Knowledge Proof
        const isValid = zkp.verifyProof(commitment, proof, nonce);

        if (isValid) {
            console.log(`✅ ZKP Verified for Nonce ${nonce}`);
            return NextResponse.json({ success: true });
        } else {
            console.warn(`❌ ZKP Verification Failed for Nonce ${nonce}`);
            return NextResponse.json({ error: "Proof Verification Failed" }, { status: 401 });
        }

    } catch (error) {
        console.error("Verification Error:", error);
        return NextResponse.json({ error: "Internal Verification Error" }, { status: 500 });
    }
}
