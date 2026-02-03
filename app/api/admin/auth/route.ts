
import { NextResponse } from 'next/server';

const VALID_PASSWORD = "admin"; // 🚨 SECURITY: In a real app, use process.env.ADMIN_PASSWORD

// Simple In-Memory Rate Limiter
// IP -> { count: number, startTime: number }
const rateLimitMap = new Map<string, { count: number, startTime: number }>();
const WINDOW_MS = 15 * 60 * 1000; // 15 Minutes
const MAX_ATTEMPTS = 5;

export async function POST(req: Request) {
    try {
        // 1. Rate Limiting Check
        const ip = req.headers.get("x-forwarded-for") || "unknown-ip";
        const now = Date.now();
        const record = rateLimitMap.get(ip);

        if (record) {
            if (now - record.startTime > WINDOW_MS) {
                // Window expired, reset
                rateLimitMap.set(ip, { count: 1, startTime: now });
            } else {
                // Within window
                if (record.count >= MAX_ATTEMPTS) {
                    return NextResponse.json(
                        { error: "Too many attempts. Locked out for 15 minutes." },
                        { status: 429 }
                    );
                }
                record.count++;
            }
        } else {
            // New visitor
            rateLimitMap.set(ip, { count: 1, startTime: now });
        }

        const { password } = await req.json();

        // 🚨 SECURITY: In a real app, use process.env.ADMIN_PASSWORD
        // For this demo/MVP, we hardcode it SERVER-SIDE.
        // This is safe from client-side inspection.
        const VALID_PASSWORD = "admin";

        if (password === VALID_PASSWORD) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }
    } catch (error) {
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}
