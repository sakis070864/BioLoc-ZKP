// Basic Finite Field Implementation for ZKP Demo
// Uses Mersenne Prime 2^61 - 1 for efficient BigInt arithmetic
const FIELD_PRIME = 2305843009213693951n;

export interface ZKProof {
    commitment: string; // The public commitment (hex/string)
    proof: {
        t: string; // Commitment to randomness
        s: string; // Response
    };
    isValid: boolean; // Just for types, verification happens elsewhere
}

export class ZKPEngine {
    readonly p: bigint = FIELD_PRIME;
    readonly g: bigint = 3n; // Generator 1
    readonly h: bigint = 7n; // Generator 2

    // Helper: Modular Exponentiation
    modPow(base: bigint, exp: bigint, mod: bigint): bigint {
        let res = 1n;
        base = base % mod;
        while (exp > 0n) {
            if (exp % 2n === 1n) res = (res * base) % mod;
            exp = exp / 2n;
            base = (base * base) % mod;
        }
        return res;
    }

    // Hash string to Field Element using SHA-256
    async hashToField(input: string): Promise<bigint> {
        const encoder = new TextEncoder();
        const data = encoder.encode(input);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);

        // Convert ArrayBuffer to Hex String then to BigInt
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        // Take mod p
        return BigInt("0x" + hashHex) % this.p;
    }

    // Generate Random Field Element using Secure Randomness
    randomFieldElement(): bigint {
        const array = new BigUint64Array(1);
        crypto.getRandomValues(array);
        // Mask out the top 3 bits to ensure it fits within 61-bit prime easily 
        // (though modulo handles it, this keeps it cleaner for the specific prime size)
        // 2^64 is much larger than p, so rejection sampling would be ideal for perfect distribution,
        // but modulo is acceptable for this demo scope.
        return array[0] % this.p;
    }

    // Pedersen Commitment: C = g^v * h^r (mod p)
    commit(value: bigint, randomness: bigint): bigint {
        const gv = this.modPow(this.g, value, this.p);
        const hr = this.modPow(this.h, randomness, this.p);
        return (gv * hr) % this.p;
    }

    // Generate a simple ZK Proof (Simplified Schnorr-like for demo)
    // Proves knowledge of 'value' and 'randomness'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async generateProof(secretStr: string, nonce: string): Promise<{ commitment: string, proof: any }> {
        const value = await this.hashToField(secretStr);
        const r = this.randomFieldElement(); // Secret Randomness

        // 1. Calculate Commitment
        const C = this.commit(value, r);

        // 2. Generate Proof Trace (Simplified Non-Interactive)
        // In a real Fiat-Shamir, we'd hash the commitment to challenge
        const v_blind = this.randomFieldElement();
        const r_blind = this.randomFieldElement();
        const T = this.commit(v_blind, r_blind); // Blind commitment

        // Challenge c = H(C, T, nonce) - Nonce prevents Replay Attacks
        const challengeInput = C.toString() + T.toString() + nonce;
        const c = await this.hashToField(challengeInput);

        // Response z_v = v_blind + c * value
        // Response z_r = r_blind + c * r
        // CRITICAL: Exponents must be computed mod (p-1), not mod p
        const order = this.p - 1n;
        const z_v = (v_blind + c * value) % order;
        const z_r = (r_blind + c * r) % order;

        return {
            commitment: "0x" + C.toString(16),
            // r is NO LONGER RETURNED (Secret Leakage Fixed)
            proof: {
                T: "0x" + T.toString(16),
                z_v: "0x" + z_v.toString(16),
                z_r: "0x" + z_r.toString(16)
            }
        };
    }

    // Server-side verification logic
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async verifyProof(commitmentHex: string, proof: any, nonce: string): Promise<boolean> {
        try {
            const C = BigInt(commitmentHex);
            const T = BigInt(proof.T);
            const z_v = BigInt(proof.z_v);
            const z_r = BigInt(proof.z_r);

            // Recompute Challenge c (Must include Nonce)
            const challengeInput = C.toString() + T.toString() + nonce;
            const c = await this.hashToField(challengeInput);

            // Verify: g^z_v * h^z_r == T * C^c
            const left = this.commit(z_v, z_r);
            const right_T = T;
            const right_C_c = this.modPow(C, c, this.p);
            const right = (right_T * right_C_c) % this.p;

            return left === right;
        } catch {
            return false;
        }
    }
}

export const zkp = new ZKPEngine();
