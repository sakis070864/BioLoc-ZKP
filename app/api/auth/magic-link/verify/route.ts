import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { createIntentToken } from '@/lib/auth-cookie';

export async function POST(req: Request) {
    try {
        const { token } = await req.json();

        if (!token) {
            return NextResponse.json({ error: "Missing token" }, { status: 400 });
        }

        // 1. Query Firestore for the magic link token
        const q = query(
            collection(db, "magic_links"),
            where("token", "==", token),
            where("active", "==", true)
        );

        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return NextResponse.json({ error: "Invalid or expired magic link" }, { status: 401 });
        }

        const linkDoc = querySnapshot.docs[0];
        const linkData = linkDoc.data();

        // 2. Check Expiration
        if (linkData.expiresAt?.toDate() < new Date()) {
            return NextResponse.json({ error: "Magic link has expired" }, { status: 401 });
        }

        // 3. Mark link as used immediately to prevent re-use
        await updateDoc(linkDoc.ref, { active: false });

        // 4. Fetch existing user info if available to preserve roles
        const userRef = doc(db, 'companies', linkData.companyId, 'users', linkData.employeeId);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.exists() ? userSnap.data() : {};

        // 5. Generate Intent Token
        const sessionPayload = {
            companyId: linkData.companyId,
            userId: linkData.employeeId,
            role: userData.role || 'user',
            name: linkData.name,
            isMagicLinkFlow: true
        };

        const intentToken = await createIntentToken(sessionPayload);

        return NextResponse.json({
            success: true,
            intentToken,
            userData: {
                id: linkData.employeeId,
                name: linkData.name,
                companyId: linkData.companyId
            }
        });

    } catch (error) {
        console.error("Magic Link Verification API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
