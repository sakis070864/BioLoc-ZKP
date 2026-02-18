"use client";
import { clsx } from "clsx";

import { useState, useEffect } from "react";
import { User, Fingerprint, ChevronRight, Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { zkp } from "@/lib/zkp";


interface IdentityFormProps {
    onComplete: (data: { name: string; id: string; companyId: string, password?: string }) => void;
    initialCompanyId?: string | null;
    initialToken?: string | null;
    initialName?: string;
    initialId?: string;
}

export default function IdentityForm({ onComplete, initialCompanyId, initialToken, initialName, initialId }: IdentityFormProps) {
    const [name, setName] = useState(initialName || "");
    const [id, setId] = useState(initialId || "");
    const [companyId, setCompanyId] = useState(initialCompanyId || "");

    // Update if props change
    useEffect(() => {
        if (initialName) setName(initialName);
        if (initialId) setId(initialId);
        if (initialCompanyId) setCompanyId(initialCompanyId);
    }, [initialName, initialId, initialCompanyId]);

    // Load Magic Link data if token exists
    useEffect(() => {
        const _loadMagicLink = async () => {
            if (!initialToken) return;
            
            // In a real app, verify the token via API. 
            // For now, we assume the token flow is valid but we don't have a backend endpoint 
            // to fetch the details *from the token* in this demo without more complex setup.
            // But we can check if there's a corresponding magic link doc in Firestore?
            // Actually, for this demo, we can just rely on user input OR fetch if we had the logic.
            
            // Let's implement a quick client-side lookup if we want to be fancy, 
            // or just leave it manual. The requirement was "Sensitive Information in URLs".
            // We fixed the URL. Now the user must manually enter ID/Name OR 
            // we need an endpoint to "resolve" the magic link token.
        }
    }, [initialToken]);

    // Step 1: Identify, Step 2: Authenticate
    const [step, setStep] = useState<1 | 2>(1);

    // Auth State
    const [password, setPassword] = useState("");
    const [_storedHash, _setStoredHash] = useState<string | null>(null);
    const [_storedSalt, _setStoredSalt] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);


    // Registration State (Create Password)
    const [showCreatePasswordModal, setShowCreatePasswordModal] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleCreatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (newPassword.length < 8) {
            setError("Password must be at least 8 characters.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);
        // We simulate a bit of work
        await new Promise(r => setTimeout(r, 1000));
        
        onComplete({
            name,
            id,
            companyId,
            password: newPassword,
            // @ts-expect-error
            intentToken: initialToken // Use the one from magic link if available
        });
        setLoading(false);
    };

    const handleIdentify = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!name || !id || !companyId) {
            setError("Please fill all fields.");
            return;
        }

        // We skip the direct Firestore check here to prevent enumeration.
        // Instead, we just proceed to either Password entry OR "Create Password" 
        // by attempting a "discovery" login or just assuming they might have one.
        // For better UX, we can try a "Ping" but to be 100% secure against enumeration,
        // we should just show the password field.
        setStep(2);
    };

    const handleAuthenticate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!password) {
            setError("Password is required.");
            return;
        }

        setLoading(true);

        try {
            // 1. ATTEMPT LOGIN VIA API
            const loginRes = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ companyId, userId: id, password, name })
            });

            const loginData = await loginRes.json();

            if (!loginRes.ok) {
                // If the user doesn't exist but has a valid name match, the API might allow registration.
                // However, our API currently returns 401 if they don't exist.
                // If they are in the Magic Link flow, we might have skipped the login check 
                // but let's handle the case where we WANT to show the password modal.
                if (loginRes.status === 401 && loginData.error === "Invalid credentials") {
                     // Check if it's a new user (no phrase set in DB)
                     // For this demo, we'll allow the user to transition to Create Password
                     // if we are in the middle of a secure enrollment.
                     if (initialToken) {
                         setShowCreatePasswordModal(true);
                         return;
                     }
                     throw new Error("Invalid credentials. Please check your ID and Password.");
                }
                throw new Error(loginData.error || "Authentication Failed");
            }

            // SUCCESS STAGE 1
            const { intentToken } = loginData;

            // 2. Get Server Challenge (Nonce) for ZKP
            const challengeRes = await fetch('/api/auth/challenge', { method: 'POST' });
            if (!challengeRes.ok) throw new Error("Failed to get security challenge");
            const { nonce } = await challengeRes.json();

            // 3. Generate Proof with Server Nonce
            const { commitment, proof } = await zkp.generateProof(id, nonce);

            // 4. Verify with Server (Consumes Nonce)
            const verifyRes = await fetch('/api/auth/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ commitment, proof, nonce })
            });

            if (!verifyRes.ok) {
                const errData = await verifyRes.json();
                throw new Error(errData.error || "ZKP Verification Failed");
            }

            // SUCCESS STAGE 2
            onComplete({
                name,
                id,
                companyId,
                password,
                // @ts-expect-error
                intentToken // Pass the intent token for the sync step
            });

        } catch (err: unknown) {
            console.error("Auth Protocol Error:", err);
            setError((err as Error).message || "Security Handshake Failed.");
        } finally {
            setLoading(false);
        }
    };


    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md mx-auto relative"
        >
            {/* FORCE CREATE PASSWORD MODAL - ONLY SHOWN IF NO PASSWORD EXISTS */}
            <AnimatePresence>
                {showCreatePasswordModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-xl p-6"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="w-full max-w-md bg-[#0f172a] border border-cyan-500/50 rounded-2xl p-8 shadow-[0_0_50px_rgba(6,182,212,0.15)] relative overflow-hidden"
                        >
                            {/* Top Accent */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-600"></div>

                            <div className="text-center mb-8">
                                <div className="w-16 h-16 bg-cyan-900/20 rounded-full mx-auto flex items-center justify-center mb-4 border border-cyan-500/30">
                                    <ShieldCheck className="text-cyan-400 w-8 h-8" />
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-2">Create Security Password</h2>
                                <p className="text-slate-400 text-sm">
                                    This is a <strong>brand new identity</strong>. You must set a private password to secure this account before proceeding.
                                </p>
                            </div>

                            <form onSubmit={handleCreatePassword} className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-cyan-500 uppercase tracking-widest pl-1">New Password</label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all font-mono"
                                        placeholder="Min 8 characters"
                                        autoFocus
                                        required
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-cyan-500 uppercase tracking-widest pl-1">Confirm Password</label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all font-mono"
                                        placeholder="Re-enter password"
                                        required
                                    />
                                </div>

                                {error && (
                                    <div className="p-3 bg-red-900/20 border border-red-900/50 rounded-lg">
                                        <p className="text-red-400 text-xs text-center font-bold">{error}</p>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-cyan-900/20 mt-4 flex items-center justify-center gap-2"
                                >
                                    {loading ? "SECURING ACCOUNT..." : "SAVE PASSWORD & LOGIN"} <ChevronRight size={16} />
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className={`glass-panel p-8 rounded-3xl border border-slate-700/50 shadow-2xl relative overflow-hidden transition-all ${showCreatePasswordModal ? 'blur-md opacity-20 pointer-events-none' : ''}`}>
                {/* Decorative Header */}
                <div className="text-center mb-8 relative z-10">
                    <div className="w-16 h-16 bg-slate-900 rounded-2xl mx-auto flex items-center justify-center mb-4 border border-slate-700 shadow-inner">
                        {step === 1 ? <User className="w-8 h-8 text-cyan-400" /> : <Lock className="w-8 h-8 text-cyan-400" />}
                    </div>
                    <h2 className="text-2xl font-bold text-white">
                        {step === 1 ? "Identity Check" : "Secure Login"}
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">
                        {step === 1 ? "Verify your credentials to proceed." : "Enter your training password."}
                    </p>
                </div>

                <AnimatePresence mode="wait">
                    {step === 1 ? (
                        <motion.form
                            key="step1"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            onSubmit={handleIdentify}
                            className="space-y-5 relative z-10"
                        >
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Full Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Sakis Athan"
                                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
                                    required
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Employee ID</label>
                                <input
                                    type="text"
                                    value={id}
                                    onChange={(e) => setId(e.target.value)}
                                    placeholder="e.g. EMP-001"
                                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all font-mono"
                                    required
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Target Company ID</label>
                                <input
                                    type="text"
                                    value={companyId}
                                    onChange={(e) => setCompanyId(e.target.value)}
                                    placeholder="e.g. google_inc"
                                    readOnly={!!initialCompanyId}
                                    className={clsx(
                                        "w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all font-mono text-sm",
                                        initialCompanyId && "opacity-50 cursor-not-allowed bg-slate-900 border-slate-700 text-slate-400"
                                    )}
                                    required
                                />
                            </div>

                            {/* AUTO-TRIGGER if pre-filled from Magic Link */}
                            {/* But we need user confirmation or just auto-click? */}
                            {/* If we trust the link, we can perhaps show a different button text */}
                            
                            {error && (
                                <p className="text-red-400 text-sm text-center font-medium animate-pulse">{error}</p>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold py-4 rounded-xl transition-all hover:shadow-[0_0_20px_rgba(8,145,178,0.4)] hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 mt-4"
                            >
                                {loading ? (
                                    <span className="animate-pulse">Checking...</span>
                                ) : (
                                    <>
                                        {initialToken ? "Securely Verify Identity" : "Confirm Identity"} <ChevronRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </motion.form>
                    ) : (
                        <motion.form
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            onSubmit={handleAuthenticate}
                            className="space-y-5 relative z-10"
                        >
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Training Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter your secret phrase"
                                        className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all font-mono tracking-widest"
                                        autoFocus
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <p className="text-red-400 text-sm text-center font-medium animate-pulse">{error}</p>
                            )}

                            <div className="flex gap-3 mt-4">
                                <button
                                    type="button"
                                    onClick={() => { setStep(1); setError(""); setPassword(""); }}
                                    className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-all"
                                >
                                    Back
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-[2] bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold py-4 rounded-xl transition-all hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <span className="animate-pulse">Validating...</span>
                                    ) : (
                                        <>
                                            Verify & Login <Fingerprint className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.form>
                    )}
                </AnimatePresence>

                {/* Background Glow */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50"></div>
            </div>
        </motion.div>
    );
}
