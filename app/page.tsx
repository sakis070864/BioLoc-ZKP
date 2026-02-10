
"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AiGatekeeper from "@/components/AiGatekeeper";
import { Activity, Lock, Shield, Keyboard, Smartphone, Eye, ShieldAlert, Unlock, Cog, RefreshCcw } from "lucide-react";

// --- COMPONENTS ---

// 1. MOUSE TRAIL & VELOCITY TRACKER


// 2. MINI CARDIOGRAM (Visualizer with Multi-Frequency)
const MiniCardiogram = ({ spike }: { spike: number }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spikeRef = useRef(spike);

  useEffect(() => { spikeRef.current = spike; }, [spike]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let t = 0;
    let animId: number;
    let localSpike = 0;

    const loop = () => {
      localSpike = localSpike * 0.9 + spikeRef.current * 0.1;

      const w = canvas.width;
      const h = canvas.height;
      const baseH = h / 2;

      ctx.clearRect(0, 0, w, h);

      const intensity = 0.3 + localSpike;
      ctx.lineWidth = 1.5 + localSpike * 3; // Thicker line on activity

      const gradient = ctx.createLinearGradient(0, 0, w, 0);
      gradient.addColorStop(0, "rgba(34, 211, 238, 0)");
      gradient.addColorStop(0.5, `rgba(34, 211, 238, ${Math.min(intensity, 1)})`);
      gradient.addColorStop(1, "rgba(34, 211, 238, 0)");
      ctx.strokeStyle = gradient;

      ctx.beginPath();
      for (let x = 0; x < w; x += 4) {
        // Wave 1: Carrier
        const w1 = Math.sin(x * 0.01 + t * 0.5) * (10 + localSpike * 30);
        // Wave 2: Flutter
        const w2 = Math.cos(x * 0.03 - t * 2) * (5 + localSpike * 20);
        // Wave 3: Noise (Always present)
        const noise = (Math.random() - 0.5) * (4 + localSpike * 40);

        const y = baseH + w1 + w2 + noise;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      t += 0.15; // Speed up
      animId = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(animId);
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none mix-blend-screen opacity-80" width={600} height={200} />;
};

// 3. LIVE DATA STREAM (The "Matrix" Feed)
const DataStream = ({ logs }: { logs: string[] }) => {
  return (
    <div className="w-full h-full p-4 overflow-hidden font-mono text-[9px] leading-tight flex flex-col justify-end opacity-80 bg-slate-950/80">
      {logs.slice(-6).map((log, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-cyan-500/80 mb-1 whitespace-nowrap"
        >
          <span className="text-cyan-800 mr-2">[{new Date().toLocaleTimeString().split(" ")[0]}]</span>
          {log}
        </motion.div>
      ))}
    </div>
  );
};


// 3. LIVE TERMINAL SIDEBAR
const TerminalSidebar = () => {
  const [lines, setLines] = useState<string[]>([]);

  useEffect(() => {
    const msgs = [
      "[BIO-LOC]: System Initialization...",
      "[ZKP]: Zero-Knowledge Proof Environment Active",
      "[NET]: Secure Tunnel Established (TLS 1.3)",
      "[BIO-LOC]: Monitoring User Cadence...",
      "[ZKP]: Generating recursive proofs...",
      "[SYS]: Entropy Levels Normal (99.8%)",
      "[BIO-LOC]: Analyzing keystroke dynamics...",
      "[GUARD]: Sentinel Protocol Online",
    ];
    const interval = setInterval(() => {
      setLines(prev => [...prev.slice(-10), msgs[Math.floor(Math.random() * msgs.length)]]);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="hidden lg:block fixed left-4 top-1/2 -translate-y-1/2 w-64 h-96 pointer-events-none opacity-50 z-10 font-mono text-[10px] text-cyan-500/40 overflow-hidden">
      <div className="border-l border-cyan-500/20 pl-4 h-full flex flex-col justify-end">
        {lines.map((l, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-1"
          >
            <span className="text-cyan-300/60">{new Date().toLocaleTimeString().split(' ')[0]}</span> {l}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// 5. HARDWARE CONTROL UNIT COMPONENTS
const dataRecord = [
  { label: "Asset ID", initial: "TANK-GAMMA-4", secure: "009827.441" },
  { label: "Flow Rate", initial: "Unmetered", secure: "180.03.LTR" },
  { label: "Pressure", initial: "Critical_PSI", secure: "350.47.BAR" },
  { label: "Security Hash", initial: "james@athan.com", secure: "SHA.708.342" },
  { label: "Node Access", initial: "Lead_Arch", secure: "256.41.001" },
  { label: "System Key", initial: "Auth_V2", secure: "0.5278.AES" },
];

const RollingDigit = ({ char, delay }: { char: string, delay: number }) => {
  const characters = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "X", "Y", "Z", char];
  const itemHeight = 32;

  return (
    <div
      className="relative w-[0.75em] flex justify-center bg-slate-950 overflow-hidden border-x border-white/10 mx-[0.5px] shadow-inner"
      style={{ height: `${itemHeight}px` }}
    >
      <motion.div
        initial={{ y: 0 }}
        animate={{ y: -(characters.length - 1) * itemHeight }}
        transition={{
          type: "spring",
          stiffness: 35,
          damping: 12,
          delay: delay,
        }}
        className="flex flex-col"
      >
        {characters.map((c, i) => (
          <span
            key={i}
            className="flex items-center justify-center text-cyan-400 font-bold text-lg md:text-xl transition-all"
            style={{
              height: `${itemHeight}px`,
              lineHeight: `${itemHeight}px`,
              textShadow: i === characters.length - 1 ? "0 0 8px rgba(34, 211, 238, 0.6)" : "none"
            }}
          >
            {c}
          </span>
        ))}
      </motion.div>
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black via-transparent to-black opacity-80" />
      <div className="absolute top-0 left-0 w-full h-[1px] bg-white/5" />
    </div>
  );
};

const HardwareControlUnit = () => {
  const [isSecured, setIsSecured] = useState(false);
  const [progress, setProgress] = useState(0);
  const [cycle, setCycle] = useState(0); // Used to trigger automatic re-runs

  useEffect(() => {
    // Reset states at the start of a new cycle
    requestAnimationFrame(() => {
      if (isSecured) setIsSecured(false);
      if (progress !== 0) setProgress(0);
    });

    // 1. Handle Progress Bar increment
    const progressInterval = setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 100 : prev + 1));
    }, 25);

    // 2. Trigger "Secured" state (odometer spin) after progress completion
    const secureTimeout = setTimeout(() => {
      setIsSecured(true);
    }, 3200);

    // 3. Automatically restart the cycle after a hold period
    const restartTimeout = setTimeout(() => {
      setCycle((c) => c + 1);
    }, 9000); // 9 seconds total cycle duration

    return () => {
      clearInterval(progressInterval);
      clearTimeout(secureTimeout);
      clearTimeout(restartTimeout);
    };
  }, [cycle]);

  return (
    <div className="w-full flex justify-center py-12">
      <style dangerouslySetInnerHTML={{
        __html: `
        .animate-spin-slow {
          animation: custom-spin 8s linear infinite;
        }
        @keyframes custom-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      ` }} />

      <div className="relative z-10 w-full max-w-3xl transform hover:scale-[1.01] transition-transform duration-500">
        {/* Terminal Header */}
        <div className="flex items-center justify-between mb-4 px-3 text-[10px] uppercase tracking-[0.3em] text-white/30">
          <div className="flex items-center gap-2">
            <Cog className={`animate-spin-slow ${!isSecured ? 'text-rose-500' : 'text-cyan-500'}`} size={14} />
            <span>Hardware_Control_Unit_v4.2</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <RefreshCcw size={10} className="animate-spin text-white/20" />
              <span>Auto_Cycle</span>
            </div>
            <span className="opacity-50">Cycle: {cycle.toString().padStart(3, '0')}</span>
          </div>
        </div>

        {/* Machine Housing */}
        <div className="relative bg-slate-900/80 border-[4px] border-slate-800 rounded-xl p-6 md:p-10 shadow-2xl backdrop-blur-sm">
          <div className="absolute top-3 left-3 w-1.5 h-1.5 rounded-full bg-cyan-500/20 border border-cyan-500/30" />
          <div className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-cyan-500/20 border border-cyan-500/30" />
          <div className="absolute bottom-3 left-3 w-1.5 h-1.5 rounded-full bg-cyan-500/20 border border-cyan-500/30" />
          <div className="absolute bottom-3 right-3 w-1.5 h-1.5 rounded-full bg-cyan-500/20 border border-cyan-500/30" />

          <div className="space-y-6">
            {dataRecord.map((item, index) => (
              <div key={`${cycle}-${index}`} className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/[0.05] pb-4 last:border-0">
                <span className="text-white/40 text-[11px] uppercase tracking-widest flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${isSecured ? 'bg-cyan-500 shadow-[0_0_10px_#22d3ee]' : 'bg-rose-500 animate-pulse'}`} />
                  {item.label}
                </span>

                <div className="relative bg-slate-950 h-12 px-4 rounded-sm border border-white/5 flex items-center justify-center md:justify-end min-w-[240px] overflow-hidden shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
                  <AnimatePresence mode="wait">
                    {!isSecured ? (
                      <motion.div
                        key="initial"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -40, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="text-rose-500/80 text-lg md:text-xl font-bold flex items-center gap-2"
                      >
                        <Unlock size={14} className="opacity-30" />
                        {item.initial}
                      </motion.div>
                    ) : (
                      <motion.div
                        key="secure"
                        className="flex items-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <Lock size={14} className="text-cyan-500/20 mr-3" />
                        {item.secure.split('').map((char, charIdx) => (
                          <RollingDigit
                            key={charIdx}
                            char={char}
                            delay={index * 0.08 + charIdx * 0.04}
                          />
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>

          {/* Progress Section */}
          <div className="mt-10 pt-6 border-t border-white/10">
            <div className="flex justify-between items-center text-[9px] uppercase tracking-[0.3em] text-white/20 mb-3">
              <span>Sequence Calibration</span>
              <span className={isSecured ? "text-cyan-400" : ""}>{progress}%</span>
            </div>
            <div className="h-2 bg-slate-950 rounded-full p-[2px] border border-white/5">
              <motion.div
                className={`h-full rounded-full transition-colors duration-1000 ${isSecured ? 'bg-cyan-500 shadow-[0_0_15px_#06b6d4]' : 'bg-rose-700'}`}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Footer Hardware Status */}
        <div className="mt-8 flex flex-col items-center gap-5">
          <div className={`flex items-center gap-3 px-6 py-2.5 rounded border transition-all duration-1000 ${isSecured
            ? "border-cyan-500/40 text-cyan-400 bg-cyan-500/5 shadow-[0_0_30px_rgba(6,182,212,0.1)]"
            : "border-rose-500/40 text-rose-500 bg-rose-500/5"
            }`}>
            {isSecured ? <Shield size={16} /> : <ShieldAlert size={16} className="animate-pulse" />}
            <span className="text-[10px] font-black tracking-[0.4em] uppercase">
              {isSecured ? "Data Integrity Secured" : "Security Breach Pending"}
            </span>
          </div>

          <div className="text-[9px] text-white/20 uppercase tracking-[0.5em] text-center max-w-md leading-relaxed h-8">
            {isSecured
              ? "Mechanical synchronization complete. Restarting in 5s..."
              : "Neutralizing data strings... Please remain connected."}
          </div>
        </div>
      </div>
    </div>
  );
};


export default function LandingPage() {
  const [testInput, setTestInput] = useState("");
  const [logs, setLogs] = useState<string[]>([]);
  const [spikeActivity, setSpikeActivity] = useState(0);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const typingTimer = useRef<NodeJS.Timeout | null>(null);
  const lastKeyTime = useRef(0);
  const sessionStart = useRef(0);
  const keyPressCount = useRef(0);
  const errorCount = useRef(0);

  // FULL 15-FACTOR BIOMETRIC STATE
  const [bioMetrics, setBioMetrics] = useState({
    doubleTapSpeed: 0,
    dwellTimeAvg: 0,
    flightTimeAvg: 0,
    rhythmVariance: 0,
    pinkyIndexRatio: 1, // Default neutral
    shiftBalance: 0, // -1 Left, 1 Right
    errorRate: 0,
    glideFactor: 0,
    postErrorSlowdown: 0,
    startupLatency: 0,
    trigraphVelocity: 0,
    holdingStability: 0, // Mobile only (simulated 0 for desktop)
    gaitEnergy: 0,       // Mobile only
    holdingAngleMean: 0, // Mobile only
    spacebarImpact: 0,
  });

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [status, setStatus] = useState<"IDLE" | "SENDING" | "SUCCESS" | "ERROR">("IDLE");
  const [showAiModal, setShowAiModal] = useState(false);

  // 1. MOUSE MONITORING
  const lastMouse = useRef({ x: 0, y: 0, time: 0 });
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const now = performance.now();
      const dt = now - lastMouse.current.time;
      if (dt > 100) {
        const dx = e.clientX - lastMouse.current.x;
        const dy = e.clientY - lastMouse.current.y;
        const velocity = Math.sqrt(dx * dx + dy * dy) / dt;

        // Update specific mouse metrics in logs
        const newLogs: string[] = [];
        if (Math.random() > 0.7) newLogs.push(`glideFactor: ${(velocity * 0.4).toFixed(4)}`);
        if (Math.random() > 0.8) newLogs.push(`holdingStability: ${(0.9 + Math.random() * 0.1).toFixed(4)}`); // Mock stability

        setLogs(prev => [...prev.slice(-10), ...newLogs]);
        setSpikeActivity(Math.min(velocity * 0.5, 1.2));
        lastMouse.current = { x: e.clientX, y: e.clientY, time: now };
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);



  // 2. DYNAMIC SCORING ALGORITHM
  const calculateScore = () => {
    // We want a score that feels ALIVE. 
    // 100 is base. We subtract for variance and errors. We reward for "human" inconsistency.

    let score = 100; // Start perfect

    // 1. RHYTHM VARIANCE (The biggest factor)
    // Humans are not metronomes. Too low variance (<10ms) is suspicious. Too high (>150ms) is erratic.
    const v = bioMetrics.rhythmVariance;
    if (v < 10) score -= 15; // Bot-like precision
    else if (v > 200) score -= (v - 200) * 0.1; // Sloppy typing penalty scaling
    else score += 0; // Sweet spot (10-200ms variance is good)

    // 2. FLIGHT TIME (Speed)
    // Super fast (<40ms) or super slow (>400ms) gets tiny deductions
    const ft = bioMetrics.flightTimeAvg;
    if (ft < 40) score -= 5;
    if (ft > 400) score -= 5;

    // 3. ERROR RATE (Heavy Hit)
    score -= (bioMetrics.errorRate * 40);

    // 4. ENTROPY / "HUMAN JITTER"
    // We look for the "Liveness" factor. 
    const glideBonus = bioMetrics.glideFactor > 0 ? 2 : 0; // Mouse usage adds trust
    score += glideBonus;

    // 5. CLAMPING
    // Ensure it stays within "Verified" (70%+) or "Suspicious" (<50%) ranges loosely
    // But let it vary!
    return Math.max(0, Math.min(99.9, score));
  };

  // 3. TYPING HANDLER (The Core Loop)
  const handleTestInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const now = performance.now();
    const val = e.target.value;
    const char = val.slice(-1);

    // Initialization on first key of the session
    if (val.length <= 1) {
      sessionStart.current = now;
      lastKeyTime.current = now; // Reset to avoid massive flight time calc
      keyPressCount.current = 0;
      errorCount.current = 0;
      // Reset metrics slightly but keep some history for "learning" feel
      setBioMetrics(b => ({ ...b, startupLatency: Math.random() * 200 + 50, rhythmVariance: 0, flightTimeAvg: 0 }));
      setTestInput(val);
      return; // Skip calc for first char
    }

    // Variance / Timing Calculation
    let flightTime = now - lastKeyTime.current;

    // Filter out massive pauses (user stepped away) so they don't tank the score
    if (flightTime > 1000) flightTime = 200;

    if (val.length < testInput.length) errorCount.current++;
    keyPressCount.current++;

    const currentErrorRate = errorCount.current / Math.max(1, keyPressCount.current);
    const dwellRaw = Math.max(30, Math.min(150, 100 + (Math.random() * 40 - 20))); // 80-120ms with noise

    // Update Internal Biometric Model
    setBioMetrics(prev => {
      const newFlightAvg = prev.flightTimeAvg === 0 ? flightTime : (prev.flightTimeAvg * 0.8 + flightTime * 0.2); // Fast adaptation
      const newVariance = Math.abs(newFlightAvg - flightTime);

      return {
        ...prev,
        dwellTimeAvg: (prev.dwellTimeAvg * 0.9 + dwellRaw * 0.1),
        flightTimeAvg: newFlightAvg,
        rhythmVariance: (prev.rhythmVariance * 0.8 + newVariance * 0.2),
        errorRate: currentErrorRate,
        trigraphVelocity: newFlightAvg * 3,
        pinkyIndexRatio: ["p", "q", "z", "a", "1"].includes(char.toLowerCase()) ? 0.85 : 1.05,
        spacebarImpact: char === " " ? 1 : 0
      };
    });

    setTestInput(val);
    setFinalScore(null);
    setSpikeActivity(1.5 + (Math.random())); // Dynamic spike

    // STREAM ALL METRICS 
    const metricsToShow = [
      `dap: ${(flightTime / 2).toFixed(1)}ms`, // double tap speed
      `flt: ${flightTime.toFixed(0)}ms`,      // current flight time
      `var: ${Math.abs(bioMetrics.flightTimeAvg - flightTime).toFixed(1)}`, // current variance
      `err: ${(currentErrorRate * 100).toFixed(0)}%`, // error rate
      `gait: ${(Math.random()).toFixed(3)}`  // mobile gait sim
    ];

    // Push 1-2 random metrics
    const logEntry = metricsToShow[Math.floor(Math.random() * metricsToShow.length)];
    setLogs(prev => [...prev.slice(-12), logEntry]);

    lastKeyTime.current = now;

    // "Session End" Timer
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      if (val.length > 2) {
        const calculated = calculateScore();
        // Add tiny random jitter to final Result so it rarely looks IDENTICAL even if behavior is similar
        const jitter = (Math.random() * 0.4) - 0.2;
        setFinalScore(parseFloat((calculated + jitter).toFixed(1)));
      }
    }, 800); // 800ms silence = done
  };

  // 4. DECAY LOOP
  useEffect(() => {
    const int = setInterval(() => {
      setSpikeActivity(s => s > 0.05 ? s * 0.9 : 0);
    }, 50);
    return () => clearInterval(int);
  }, []);


  const handleAiVerificationSuccess = async () => {
    // ... (Keep existing logic)
    setShowAiModal(false);
    setStatus("SENDING");
    try {
      const res = await fetch("/api/send-request", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, company })
      });
      if (res.ok) { setStatus("SUCCESS"); setEmail(""); setName(""); setCompany(""); }
      else setStatus("ERROR");
    } catch { setStatus("ERROR"); }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name || !company) return;
    setShowAiModal(true);
  };


  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-cyan-500/30 overflow-x-hidden relative">

      <TerminalSidebar />

      {/* Global Grid Overlay */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-0" />

      {/* HEADER */}
      <header className="fixed top-0 w-full z-40 border-b border-cyan-900/20 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="text-cyan-400" size={20} />
            <span className="font-mono font-bold tracking-widest text-cyan-400 text-lg">BIO LOC</span>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-cyan-600/60">
            <span className="hidden md:inline-block">STATUS: <span className="text-green-500 animate-pulse">SECURE</span></span>
            <span className="hidden md:inline-block">ENCRYPTION: ZKP-SNARK</span>
          </div>
        </div>
      </header>

      <main className="relative z-10 pt-32 pb-24 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">

        {/* HERO SECTION */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="max-w-4xl space-y-8 mb-32"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-950/30 text-cyan-400 text-[10px] tracking-[0.2em] font-mono uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            Sentient Guardian Protocol V4.0
          </div>

          <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white relative">
            IDENTITY IS A <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 animate-gradient-x">
              RHYTHM
            </span>
          </h1>

          <p className="text-xl text-slate-400 max-w-2xl mx-auto font-light leading-relaxed">
            Hackers can steal your characters. They cannot steal your <strong className="text-cyan-300 font-medium">muscle memory</strong>.
            Experience the first authentication powered by <span className="border-b border-cyan-500/30 text-white">Zero-Knowledge Proofs</span>.
          </p>

          {/* INTERACTIVE TEST BOX */}
          <div className="mt-12 p-1 rounded-2xl bg-gradient-to-r from-cyan-500/20 to-purple-600/20 max-w-2xl mx-auto transform hover:scale-[1.01] transition-transform duration-500 relative shadow-2xl">
            <div className="bg-slate-950 rounded-xl border border-white/5 relative z-10 overflow-hidden text-left flex flex-col">

              {/* TOP SPLIT: ANALOG (Left) vs DIGITAL (Right) */}
              <div className="grid grid-cols-2 divide-x divide-white/5 h-40 border-b border-white/5 bg-slate-900/30">

                {/* WINDOW 1: SIGNAL (Wave) */}
                <div className="relative overflow-hidden group">
                  <div className="absolute top-2 left-3 text-[9px] font-mono text-cyan-500/40 tracking-widest z-10 group-hover:text-cyan-400 transition-colors">
                    SIGNAL_SCOPE_A
                  </div>
                  <MiniCardiogram spike={spikeActivity} />
                </div>

                {/* WINDOW 2: ANALYSIS (Data) */}
                <div className="relative overflow-hidden group">
                  <div className="absolute top-2 left-3 text-[9px] font-mono text-cyan-500/40 tracking-widest z-10 group-hover:text-cyan-400 transition-colors">
                    LIVE_PACKET_STREAM
                  </div>
                  <DataStream logs={logs} />
                </div>
              </div>

              {/* WINDOW 3: RESULT (Overlay/Modal inside box) */}
              <AnimatePresence>
                {finalScore && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-green-950/20 border-b border-green-500/20"
                  >
                    <div className="p-4 flex items-center justify-between px-8">
                      <div className="text-left">
                        <div className="text-xs font-mono text-green-500 tracking-widest mb-1">IDENTITY VERIFIED</div>
                        <div className="text-[10px] text-green-400/60 font-mono">ZKP HASH MATCHED</div>
                      </div>
                      <div className="text-right">
                        <div className="text-4xl font-black text-white tracking-tighter leading-none">
                          {finalScore}<span className="text-xl text-green-500">%</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* BOTTOM: INPUTS */}
              <div className="p-6 space-y-4 bg-slate-950">
                <div className="flex justify-between items-center text-xs font-mono text-cyan-500/70">
                  <span>TEST YOUR DNA</span>
                  <span className="animate-pulse">waiting for input...</span>
                </div>
                <input
                  type="text"
                  value={testInput}
                  onChange={handleTestInput}
                  placeholder="Type name to start..."
                  className="w-full bg-slate-900/50 border border-slate-800 rounded p-4 text-center text-white placeholder:text-slate-700 focus:outline-none focus:border-cyan-500 transition-colors tracking-widest text-lg font-mono focus:bg-slate-900"
                />
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="bg-slate-900/40 rounded border border-white/5 p-2 text-center">
                    <div className="text-[9px] text-slate-600 uppercase tracking-widest mb-1">Avg Dwell</div>
                    <div className="text-cyan-400 font-mono text-sm">{bioMetrics.dwellTimeAvg.toFixed(1)}ms</div>
                  </div>
                  <div className="bg-slate-900/40 rounded border border-white/5 p-2 text-center">
                    <div className="text-[9px] text-slate-600 uppercase tracking-widest mb-1">Rhythm Var</div>
                    <div className="text-purple-400 font-mono text-sm">{bioMetrics.rhythmVariance.toFixed(1)}</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </motion.div>

        {/* THE MATHEMATICAL SHIELD SECTION */}
        <div className="w-full max-w-5xl mx-auto mb-32 flex flex-col items-center text-center">

          {/* TEXT CONTENT */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex flex-col items-center text-center space-y-6"
          >
            <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs tracking-widest uppercase">
              <Shield size={16} />
              <span>Privacy First Architecture</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold leading-none">
              THE MATHEMATICAL <br />
              <span className="text-cyan-500">SHIELD</span>.
            </h2>
            <div className="space-y-6 text-slate-400 leading-relaxed text-lg md:text-xl max-w-3xl mx-auto">
              <div className="text-slate-400 leading-relaxed text-lg md:text-xl max-w-3xl mx-auto">
                <strong className="text-white block mb-2 text-2xl">&quot;Data-Anonymization via Vector Mapping&quot;</strong>
                We never store your raw movements. Our neural engine instantly translates your behavior into high-dimensional mathematical vectors—anonymous &apos;row data&apos; that is indecipherable to human eyes and useless to hackers.
              </div>
            </div>
          </motion.div>

          {/* HARDWARE CONTROL UNIT */}
          <HardwareControlUnit />

        </div>


        {/* ZKP PARADIGM SECTION */}
        <div className="grid md:grid-cols-2 gap-16 items-center w-full max-w-6xl mb-32 text-left">
          <motion.div
            initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
            className="space-y-6"
          >
            <h2 className="text-4xl md:text-5xl font-bold leading-tight">
              THE END OF <br />
              <span className="text-red-500">CENTRALIZED RISK</span>.
            </h2>
            <div className="p-6 border-l-2 border-red-500/30 bg-red-950/5">
              <p className="text-slate-400 text-lg">
                Traditional biometrics store your face and fingerprints in databases.
                <strong className="block mt-2 text-red-400">If they get hacked, you lose your identity forever.</strong>
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
            className="p-8 rounded-3xl bg-cyan-950/10 border border-cyan-500/20 backdrop-blur-sm relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <Lock size={48} className="text-cyan-400 mb-6" />
            <h3 className="text-2xl font-bold text-cyan-100 mb-4">THE ZKP SOLUTION</h3>
            <p className="text-cyan-200/70 leading-relaxed mb-6">
              BIO LOC uses <span className="text-white font-medium">Zero-Knowledge Proofs</span>.
              Your data never leaves your device. We verify the Proof, not the Secret.
            </p>
            <div className="inline-block px-4 py-2 rounded bg-cyan-900/30 text-cyan-400 font-mono text-xs border border-cyan-500/30">
              &gt; MATHEMATICALLY UNHACKABLE
            </div>
          </motion.div>
        </div >


        {/* DUAL INSTRUMENT GRID */}
        < div className="w-full max-w-6xl mb-32" >
          <div className="grid md:grid-cols-3 gap-6">
            {/* ITEM 1 */}
            <motion.div
              whileHover={{ y: -5 }}
              className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-cyan-500/30 transition-all group text-left"
            >
              <Keyboard size={32} className="text-slate-600 group-hover:text-cyan-400 mb-4 transition-colors" />
              <h3 className="text-lg font-bold text-slate-200 mb-2">KEYBOARD DNA</h3>
              <p className="text-slate-500 text-sm leading-relaxed group-hover:text-slate-400">
                Captures 10-finger typing rhythm for desktop workstations. Detailed dwell-time analysis.
              </p>
            </motion.div>

            {/* ITEM 2 */}
            <motion.div
              whileHover={{ y: -5 }}
              className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-purple-500/30 transition-all group text-left"
            >
              <Smartphone size={32} className="text-slate-600 group-hover:text-purple-400 mb-4 transition-colors" />
              <h3 className="text-lg font-bold text-slate-200 mb-2">MOBILE ANCHOR</h3>
              <p className="text-slate-500 text-sm leading-relaxed group-hover:text-slate-400">
                Analyzes 2-thumb rhythm, hand-tilt (gyroscope), and gait stability on smartphones.
              </p>
            </motion.div>

            {/* ITEM 3 */}
            <motion.div
              whileHover={{ y: -5 }}
              className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-emerald-500/30 transition-all group text-left"
            >
              <Eye size={32} className="text-slate-600 group-hover:text-emerald-400 mb-4 transition-colors" />
              <h3 className="text-lg font-bold text-slate-200 mb-2">CONTINUOUS MONITORING</h3>
              <p className="text-slate-500 text-sm leading-relaxed group-hover:text-slate-400">
                Senses anomalies in milliseconds. If the user changes, the terminal locks instantly.
              </p>
            </motion.div>
          </div>
        </div >

        {/* CONTACT SECTION (The Manual Gate) */}
        < div className="w-full max-w-2xl text-center mb-12 relative z-20" >
          <div className="p-8 border-t border-slate-800/50">
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-6">Order a Link to Try the app</h3>
            <p className="text-slate-500 text-sm mb-8 font-mono">
              Security Protocol: Access keys are generated and sent manually by human operators.
            </p>

            {status === "SUCCESS" ? (
              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded text-green-400 font-mono text-sm">
                REQUEST SECURED. ENCRYPTED PACKET SENT.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input placeholder="NAME" value={name} onChange={e => setName(e.target.value)} className="bg-slate-900/50 p-3 rounded border border-slate-800 text-center" />
                  <input placeholder="COMPANY" value={company} onChange={e => setCompany(e.target.value)} className="bg-slate-900/50 p-3 rounded border border-slate-800 text-center" />
                </div>
                <input placeholder="EMAIL ADDRESS" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-900/50 p-3 rounded border border-slate-800 text-center" />

                <button type="submit" className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold tracking-widest rounded transition-colors shadow-lg shadow-cyan-900/20">
                  {status === "SENDING" ? "ENCRYPTING..." : "CONTACT TO RECEIVE SECURE LINK"}
                </button>
              </form>
            )}
          </div>
        </div >

        <footer className="text-slate-700 text-[10px] font-mono uppercase tracking-widest">
          Secured by BIO LOC ZKP Framework © 2026
        </footer>

      </main >

      {/* AI GATEKEEPER MODAL */}
      <AnimatePresence>
        {
          showAiModal && (
            <AiGatekeeper
              onVerified={handleAiVerificationSuccess}
              onClose={() => setShowAiModal(false)}
            />
          )
        }
      </AnimatePresence >
    </div >
  );
}
