import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { randomUUID } from 'crypto';

export async function POST(_req: Request) {
    try {
        // 1. Generate Cryptographically Secure Nonce
        const nonce = randomUUID();

        // 2. Store in Firestore (with TTL/Status)
        // Storing in a dedicated collection 'auth_challenges'
        // Document ID is the nonce itself for fast lookup
        await setDoc(doc(db, 'auth_challenges', nonce), {
            createdAt: serverTimestamp(),
            status: 'PENDING',
            usedAt: null
        });

        // 3. Return to Client
        return NextResponse.json({ nonce });

    } catch (error) {
        console.error("Challenge Generation Error:", error);
        return NextResponse.json({ error: "Failed to generate challenge" }, { status: 500 });
    }
}
