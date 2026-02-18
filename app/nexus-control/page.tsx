
'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { ShieldCheck, Plus, Trash2, Copy, ExternalLink, RefreshCw, Lock, Terminal } from 'lucide-react';
import { clsx } from 'clsx';
import Link from 'next/link';

// --- TYPE DEFINITIONS ---
interface Company {
    id: string;
    displayName: string;
    createdAt: unknown;
    isActive: boolean;
    lastPaymentDate: unknown;
}

export default function NexusControl() {
    const [isUnlocked, setIsUnlocked] = useState(false);
    // --- CHECK SESSION ON MOUNT (ONLY IF UNLOCKED PARAM PRESENT) ---
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('unlocked') === 'true') {
            const checkSession = async () => {
                try {
                    const res = await fetch('/api/admin/check-session');
                    const data = await res.json();
                    if (data.unlocked) {
                        setIsUnlocked(true);
                        // Optional: Clean URL
                        window.history.replaceState({}, '', '/nexus-control');
                    }
                } catch (err) {
                    // Stay locked
                }
            };
            checkSession();
        }
    }, []);

    // --- PSYCHOLOGICAL WARFARE PROTOCOL ---
    const [showDecoy, setShowDecoy] = useState(false);
    const [decoyCode, setDecoyCode] = useState('');
    const [silentRequestSent, setSilentRequestSent] = useState(false);
    const [selfDestruct, setSelfDestruct] = useState(false);
    const [countdown, setCountdown] = useState(3);
    const [shutdownComplete, setShutdownComplete] = useState(false);

    // --- SELF DESTRUCT SEQUENCE ---
    useEffect(() => {
        if (selfDestruct && countdown > 0) {
            const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
            return () => clearTimeout(timer);
        } else if (selfDestruct && countdown === 0) {
            // SHUTDOWN SIMULATION
            setShutdownComplete(true);
            try {
                window.close(); // Best effort
            } catch (e) { }
        }
    }, [selfDestruct, countdown]);

    const handleTrap = () => {
        setSelfDestruct(true);
    };

    useEffect(() => {
        const handleKeyDown = async (e: KeyboardEvent) => {
            // TRIGGER: Ctrl + Alt + Shift + X
            if (e.ctrlKey && e.altKey && e.shiftKey && (e.key === 'x' || e.key === 'X')) {
                e.preventDefault();
                setShowDecoy(true);

                if (!silentRequestSent) {
                    setSilentRequestSent(true);
                    // SILENTLY REQUEST MAGIC LINK
                    try {
                        await fetch('/api/admin/request-link', { method: 'POST' });
                        console.log("System Alert: Multi-factor authentication sequence initiated.");
                    } catch (err) {
                        console.error("System Error: Carrier signal lost.", err);
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [silentRequestSent]);

    if (shutdownComplete) {
        return (
            <div className="fixed inset-0 bg-black z-50 cursor-none flex items-center justify-center">
                <div className="w-2 h-2 bg-white/10 rounded-full animate-ping duration-1000"></div>
            </div>
        );
    }


    if (!isUnlocked) {
        // --- RED ALERT TRAP ---
        if (selfDestruct) {
            return (
                <div className="min-h-screen bg-black flex flex-col items-center justify-center font-mono text-red-600 animate-pulse">
                    <h1 className="text-6xl font-black uppercase tracking-tighter mb-8">
                        YOU ARE UNAUTHORIZED
                    </h1>
                    <div className="text-9xl font-bold">
                        {countdown}
                    </div>
                    <p className="mt-8 text-xl uppercase tracking-[0.5em]">System Purge Imminent</p>
                </div>
            );
        }

        if (showDecoy) {
            return (
                <div className="min-h-screen bg-black text-green-500 font-mono flex items-center justify-center p-4">
                    <div className="w-full max-w-md border border-green-900/50 p-8 bg-slate-900/20 backdrop-blur-sm relative overflow-hidden">
                        {/* Scanline Effect */}
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 pointer-events-none bg-[length:100%_2px,3px_100%]" />

                        <div className="relative z-10 space-y-6">
                            <div className="flex items-center gap-2 border-b border-green-900/50 pb-4">
                                <Lock className="w-5 h-5 animate-pulse" />
                                <h2 className="text-xl font-bold tracking-widest uppercase">Security Override</h2>
                            </div>

                            <div className="space-y-4">
                                <p className="text-sm text-green-400/80 leading-relaxed">
                                    Identity Verification Required. <br />
                                    Please enter the 6-digit session code sent to your registered mobile device ending in **-88.
                                </p>

                                <div className="relative group">
                                    <input
                                        type="text"
                                        value={decoyCode}
                                        onChange={(e) => {
                                            setDecoyCode(e.target.value);
                                            handleTrap(); // TRAP TRIGGER
                                        }}
                                        onClick={handleTrap} // TRAP TRIGGER
                                        onKeyDown={handleTrap} // TRAP TRIGGER
                                        className="w-full bg-black/50 border border-green-800 p-4 text-center text-2xl tracking-[0.5em] focus:border-green-500 outline-none font-mono text-sm"
                                        placeholder="000000"
                                        maxLength={6}
                                        autoFocus
                                    />
                                    <div className="absolute right-0 top-0 bottom-0 w-2 bg-green-500/20 animate-pulse" />
                                </div>

                                <div className="text-[10px] text-green-700 uppercase tracking-widest text-center mt-8">
                                    Waiting for carrier signal...
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="min-h-screen bg-black text-slate-500 font-mono p-10 flex flex-col items-center justify-center select-none cursor-default">
                <div className="text-center space-y-4 max-w-lg">
                    <h1 className="text-6xl font-bold text-slate-800">404</h1>
                    <p className="text-xl">PAGE NOT FOUND</p>
                    <p className="text-sm text-slate-700">The requested resource could not be found on this server.</p>
                </div>
            </div>
        );
    }

    // --- REAL DASHBOARD CONTENT ---
    return <DashboardContent />;
}

function DashboardContent() {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
    const [companyUsers, setCompanyUsers] = useState<any[]>([]);
    const [newCompanyId, setNewCompanyId] = useState('');
    const [newCompanyName, setNewCompanyName] = useState('');
    const [loading, setLoading] = useState(false);
    const [generatedLink, setGeneratedLink] = useState('');


    // Real-time subscription to Companies
    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'companies'), (snapshot) => {
            const list = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Company[];
            setCompanies(list);
        });

        return () => unsubscribe();
    }, []);

    const handleGenerate = async () => {
        if (!newCompanyId || !newCompanyName) return;
        setLoading(true);

        try {
            await setDoc(doc(db, 'companies', newCompanyId), {
                displayName: newCompanyName,
                isActive: true,
                createdAt: serverTimestamp(),
                lastPaymentDate: serverTimestamp(),
                securityThreshold: 85
            });

            const host = window.location.origin;
            // Use setup_company_id to bypass biometric middleware for the customer's first entry
            setGeneratedLink(`${host}/dashboard?setup_company_id=${newCompanyId}`);

            setNewCompanyId('');
            setNewCompanyName('');
        } catch (error) {
            console.error("Failed to provision:", error);
            alert("Error creating company.");
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async (companyId: string, currentStatus: boolean) => {
        try {
            await setDoc(doc(db, 'companies', companyId), {
                isActive: !currentStatus
            }, { merge: true });
        } catch (error) {
            console.error("Error toggling status:", error);
        }
    };

    const markPaid = async (companyId: string) => {
        try {
            await setDoc(doc(db, 'companies', companyId), {
                lastPaymentDate: serverTimestamp()
            }, { merge: true });
        } catch (error) {
            console.error("Error updating payment:", error);
        }
    };

    const handleDelete = async (companyId: string) => {
        if (!confirm(`Delete ${companyId}? This is irreversible.`)) return;
        try {
            await deleteDoc(doc(db, 'companies', companyId));
        } catch (error) {
            console.error(error);
        }
    };

    const getDaysSincePayment = (timestamp: unknown) => {
        if (!timestamp) return 0;
        const date = (timestamp as { toDate?: () => Date }).toDate ? (timestamp as { toDate: () => Date }).toDate() : new Date(timestamp as string | number | Date);
        const diff = new Date().getTime() - date.getTime();
        return Math.floor(diff / (1000 * 3600 * 24));
    };

    return (
        <div className="min-h-screen p-10 relative bg-[#020617] overflow-hidden text-slate-300">
            {/* Background FX */}
            <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-red-900/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-6xl mx-auto z-10 relative">
                <header className="flex items-center justify-between mb-12 border-b border-slate-800 pb-6">
                    <div>
                        <h1 className="text-4xl font-mono font-bold text-red-500 tracking-tighter flex items-center gap-3">
                            <Terminal className="w-10 h-10" />
                            NEXUS::CONTROL
                        </h1>
                        <p className="text-slate-500 mt-2 font-mono text-sm">ROOT ACCESS GRANTED // OVERRIDE ACTIVE</p>
                    </div>
                    <Link href="/api/admin/logout" className="text-xs text-slate-600 hover:text-red-500 font-mono uppercase tracking-widest transition-colors">
                        [ Logout Session ]
                    </Link>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* LEFT: Provisioning Panel */}
                    <div className="bg-slate-900/50 backdrop-blur-md p-8 rounded-none border border-red-900/30">
                        <h2 className="text-xs font-bold text-red-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                            Provision Target
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Target Name</label>
                                <input
                                    type="text"
                                    placeholder="CORP_NAME"
                                    value={newCompanyName}
                                    onChange={(e) => setNewCompanyName(e.target.value)}
                                    className="w-full bg-black border border-slate-800 p-3 text-white focus:border-red-500 outline-none font-mono text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Protocol ID</label>
                                <input
                                    type="text"
                                    placeholder="corp_id_slug"
                                    value={newCompanyId}
                                    onChange={(e) => setNewCompanyId(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                                    className="w-full bg-black border border-slate-800 p-3 text-white focus:border-red-500 outline-none font-mono text-sm"
                                />
                            </div>

                            <button
                                onClick={handleGenerate}
                                disabled={loading || !newCompanyId || !newCompanyName}
                                className="w-full bg-red-900/20 hover:bg-red-900/40 text-red-500 border border-red-900/50 py-3 font-mono font-bold uppercase tracking-widest transition-all mt-4"
                            >
                                {loading ? "EXECUTING..." : "INITIALIZE PROTOCOL"}
                            </button>
                        </div>

                        {generatedLink && (
                            <div className="mt-6 p-4 bg-black border border-green-900/50">
                                <p className="text-[10px] text-green-500 font-bold mb-2 uppercase">INFILTRATION VECTOR GENERATED</p>
                                <div className="flex items-center justify-between gap-2">
                                    <code className="text-green-400/80 text-xs truncate font-mono bg-green-900/10 p-2 w-full">{generatedLink}</code>
                                    <button
                                        onClick={() => navigator.clipboard.writeText(generatedLink)}
                                        className="text-slate-500 hover:text-white"
                                    >
                                        <Copy className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT: Active Companies List */}
                    <div className="lg:col-span-2 bg-slate-900/50 backdrop-blur-md p-8 rounded-none border border-slate-800">
                        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6 border-b border-slate-800 pb-2">
                            Active Protocols ({companies.length})
                        </h2>

                        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                            {companies.map((company) => {
                                const days = getDaysSincePayment(company.lastPaymentDate);
                                return (
                                    <div key={company.id}
                                        className="group flex flex-col md:flex-row md:items-center justify-between p-4 bg-black border border-slate-800 hover:border-red-900/50 transition-all cursor-crosshair"
                                    >
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <div className={clsx("w-2 h-2 rounded-full", company.isActive ? "bg-green-500 animate-pulse" : "bg-red-500")} />
                                                <h3 className="font-mono text-white text-sm tracking-wider">{company.displayName.toUpperCase()}</h3>
                                            </div>
                                            <div className="ml-5 mt-1 text-[10px] text-slate-600 font-mono">
                                                ID: {company.id} | UPTIME: {days}D
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 mt-4 md:mt-0 opacity-100 transition-opacity">
                                            <a
                                                href={`/dashboard?setup_company_id=${company.id}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="bg-blue-600 text-white px-2 py-1 rounded text-[10px] uppercase font-bold hover:bg-blue-500 mr-4 border border-blue-400"
                                            >
                                                [ VIEW_DASHBOARD ]
                                            </a>

                                            <button
                                                onClick={() => toggleStatus(company.id, company.isActive)}
                                                className="text-[10px] uppercase font-bold text-slate-500 hover:text-white"
                                            >
                                                [{company.isActive ? "FREEZE" : "RESUME"}]
                                            </button>

                                            <button
                                                onClick={() => markPaid(company.id)}
                                                className="text-[10px] uppercase font-bold text-slate-500 hover:text-green-400"
                                            >
                                                [RENEW]
                                            </button>

                                            <button
                                                onClick={() => handleDelete(company.id)}
                                                className="text-[10px] uppercase font-bold text-red-900 hover:text-red-500"
                                            >
                                                [TERMINATE]
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
