import { db } from "./firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

interface SyncProofParams {
    userId: string;
    companyId: string;
    displayName: string;
    riskScore: number;
    status: "LOCKED" | "PENDING" | "REJECTED";
    zkProof?: {
        commitment: string;
        proof: any;
    };
    biometricProfile?: any;
    password?: string;
    phrase?: string;
    intentToken?: string; // Authorization for the sync
}

export const syncProofToFirebase = async (params: SyncProofParams) => {
    try {
        console.log("Syncing proof via API...", { userId: params.userId, companyId: params.companyId });

        const response = await fetch('/api/auth/sync-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params)
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || "Sync Failed");
        }

        console.log("Proof synced successfully via API!");
    } catch (error) {
        console.error("Failed to sync proof:", error);
    }
};
