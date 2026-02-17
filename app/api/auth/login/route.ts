import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { sha256, generateSalt } from '@/lib/hash';
import { createIntentToken } from '@/lib/auth-cookie';

export async function POST(req: Request) {
    try {
        const { companyId, userId, password, name } = await req.json();

        if (!companyId || !userId || !password) {
            return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
        }

        const userRef = doc(db, 'companies', companyId, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

        const userData = userSnap.data();
        let isValid = false;

        // 1. Check Hash
        if (userData.phraseHash) {
            const salt = userData.salt || "";
            const inputHash = await sha256(password, salt);
            if (inputHash === userData.phraseHash) {
                isValid = true;
            }
        }
        // 2. Check Legacy Plaintext (and upgrade if possible)
        else if (userData.phrase) {
            if (userData.phrase === password) {
                isValid = true;
                // Upgrade to hash
                const newSalt = generateSalt();
                const newHash = await sha256(password, newSalt);
                await updateDoc(userRef, {
                    phraseHash: newHash,
                    salt: newSalt,
                    phrase: null
                });
            }
        }
        // 3. First Login / Recovery (No password set)
        else {
            // Allow setting password if provided Name matches the record
            if (name && userData.displayName && userData.displayName.toLowerCase() === name.toLowerCase()) {
                isValid = true;
                // Initialize Account Security
                const newSalt = generateSalt();
                const newHash = await sha256(password, newSalt);
                await updateDoc(userRef, {
                    phraseHash: newHash,
                    salt: newSalt,
                    phrase: null
                });
            }
        }

        if (!isValid) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

        // Generate Intent Token (Stage 1 Complete)
        const sessionPayload = {
            companyId,
            userId,
            role: userData.role || 'user',
            name: userData.displayName || userId
        };

        const intentToken = await createIntentToken(sessionPayload);

        return NextResponse.json({ 
            success: true, 
            intentToken, 
            user: sessionPayload 
        });

    } catch (error) {
        console.error("Login API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
