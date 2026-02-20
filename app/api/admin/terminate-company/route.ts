import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, doc, deleteDoc, getDocs } from 'firebase/firestore';

export async function POST(req: Request) {
    try {
        const { companyId } = await req.json();

        if (!companyId) {
            return NextResponse.json({ error: "Missing companyId parameter" }, { status: 400 });
        }

        console.log(`[API Terminate] Beginning purge for ${companyId}`);

        // 1. Delete users subcollection and their nested history
        try {
            const usersSnap = await getDocs(collection(db, 'companies', companyId, 'users'));
            for (const userDoc of usersSnap.docs) {
                // Delete 'history' subcollection for this user
                const historySnap = await getDocs(collection(db, 'companies', companyId, 'users', userDoc.id, 'history'));
                for (const hDoc of historySnap.docs) {
                    await deleteDoc(hDoc.ref);
                }
                // Delete user itself
                await deleteDoc(userDoc.ref);
            }
        } catch (subErr) {
            console.error(`[API Terminate] Error deleting users:`, subErr);
            throw new Error(`Failed to delete users subcollection: ${String(subErr)}`);
        }

        // 2. Delete all login_logs in the subcollection
        try {
            const logsSnap = await getDocs(collection(db, 'companies', companyId, 'login_logs'));
            for (const logDoc of logsSnap.docs) {
                await deleteDoc(logDoc.ref);
            }
        } catch (subErr) {
            console.error(`[API Terminate] Error deleting login_logs:`, subErr);
            throw new Error(`Failed to delete login_logs subcollection: ${String(subErr)}`);
        }

        // 3. Delete the parent company document
        try {
            await deleteDoc(doc(db, 'companies', companyId));
        } catch (subErr) {
            console.error(`[API Terminate] Error deleting parent company document:`, subErr);
            throw new Error(`Failed to delete parent company document: ${String(subErr)}`);
        }

        console.log(`[API Terminate] Successfully purged ${companyId}`);
        return NextResponse.json({ success: true, message: `Successfully deleted ${companyId} and all sub-data.` });

    } catch (e) {
        console.error("[API Terminate] Fatal Error:", e);
        return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
    }
}
