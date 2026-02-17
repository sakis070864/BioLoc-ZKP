import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface BiometricProfile {
    id: string;
    timestamp: number;
    rawData?: any[]; // KeystrokeData[]
    encryptedData?: ArrayBuffer;
    iv?: Uint8Array;
    version: string;
}

interface BioLockDB extends DBSchema {
    profiles: {
        key: string;
        value: BiometricProfile;
    };
}

const DB_NAME = 'zkp-biolock-db';
const STORE_NAME = 'profiles';

// --- SECURITY: AES-GCM ENCRYPTION ---
const algorithm = { name: "AES-GCM", length: 256 };

async function getEncryptionKey(): Promise<CryptoKey> {
    const storedKeyJwk = sessionStorage.getItem("zkp_storage_key");
    if (storedKeyJwk) {
        return window.crypto.subtle.importKey(
            "jwk",
            JSON.parse(storedKeyJwk),
            algorithm,
            true,
            ["encrypt", "decrypt"]
        );
    }

    const key = await window.crypto.subtle.generateKey(algorithm, true, ["encrypt", "decrypt"]);
    const exported = await window.crypto.subtle.exportKey("jwk", key);
    sessionStorage.setItem("zkp_storage_key", JSON.stringify(exported));
    return key;
}

async function encryptData(data: any): Promise<{ ciphertext: ArrayBuffer, iv: Uint8Array }> {
    const key = await getEncryptionKey();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(JSON.stringify(data));

    const ciphertext = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        encoded
    );

    return { ciphertext, iv };
}

async function decryptData(ciphertext: ArrayBuffer, iv: Uint8Array): Promise<any> {
    try {
        const key = await getEncryptionKey();
        const decrypted = await window.crypto.subtle.decrypt(
            { name: "AES-GCM", iv: iv as any },
            key,
            ciphertext
        );
        return JSON.parse(new TextDecoder().decode(decrypted));
    } catch (e) {
        console.error("Storage decryption failed", e);
        return null;
    }
}

let dbPromise: Promise<IDBPDatabase<BioLockDB>>;

if (typeof window !== 'undefined') {
    dbPromise = openDB<BioLockDB>(DB_NAME, 1, {
        upgrade(db) {
            db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        },
    });
}

export const saveProfile = async (rawData: any[]) => {
    if (!dbPromise) return;
    const db = await dbPromise;

    const randomId = crypto.randomUUID();
    
    // SECURITY: Real AES-GCM Encryption
    const encrypted = await encryptData(rawData);

    const profile: any = {
        id: randomId,
        timestamp: Date.now(),
        encryptedData: encrypted.ciphertext,
        iv: encrypted.iv,
        version: 'v1.2-hardened'
    };

    await db.put(STORE_NAME, profile);
    return profile.id;
};

export const getLatestProfile = async () => {
    if (!dbPromise) return null;
    const db = await dbPromise;
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const all = await store.getAll();

    if (all.length === 0) return null;
    
    // Sort by timestamp
    const latest = all.sort((a, b) => b.timestamp - a.timestamp)[0];
    
    // Decrypt if it's the new format
    if (latest.encryptedData && latest.iv) {
        const decryptedRaw = await decryptData(latest.encryptedData, latest.iv);
        return { ...latest, rawData: decryptedRaw };
    }

    return latest;
};

export const clearProfiles = async () => {
    if (!dbPromise) return;
    const db = await dbPromise;
    await db.clear(STORE_NAME);
}
