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

    // Hash string to Field Element
    hashToField(input: string): bigint {
        let h = 5381n;
        for (let i = 0; i < input.length; i++) {
            const char = BigInt(input.charCodeAt(i));
            h = ((h << 5n) + h) + char; // hash * 33 + c
            h = h % this.p;
        }
        return h;
    }

    // Generate Random Field Element
    randomFieldElement(): bigint {
        const rand = BigInt(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER));
        return rand % this.p;
    }

    // Pedersen Commitment: C = g^v * h^r (mod p)
    commit(value: bigint, randomness: bigint): bigint {
        const gv = this.modPow(this.g, value, this.p);
        const hr = this.modPow(this.h, randomness, this.p);
        return (gv * hr) % this.p;
    }

    // Generate a simple ZK Proof (Simplified Schnorr-like for demo)
    // Proves knowledge of 'value' and 'randomness'
    generateProof(secretStr: string, nonce: string): { commitment: string, proof: any } {
        const value = this.hashToField(secretStr);
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
        const c = this.hashToField(challengeInput);

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
    verifyProof(commitmentHex: string, proof: any, nonce: string): boolean {
        try {
            const C = BigInt(commitmentHex);
            const T = BigInt(proof.T);
            const z_v = BigInt(proof.z_v);
            const z_r = BigInt(proof.z_r);

            // Recompute Challenge c (Must include Nonce)
            const challengeInput = C.toString() + T.toString() + nonce;
            const c = this.hashToField(challengeInput);

            // Verify: g^z_v * h^z_r == T * C^c
            const left = this.commit(z_v, z_r);
            const right_T = T;
            const right_C_c = this.modPow(C, c, this.p);
            const right = (right_T * right_C_c) % this.p;

            return left === right;
        } catch (e) {
            return false;
        }
    }
}

export const zkp = new ZKPEngine();
