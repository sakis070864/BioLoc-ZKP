import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { SignJWT } from 'jose';

// --- CONFIGURATION ---
const SECRET_KEY = new TextEncoder().encode(process.env.ADMIN_ROUTE || 'default-secret-key-change-this');

// --- RATE LIMITER (In-Memory) ---
const rateLimitMap = new Map<string, { count: number, startTime: number }>();
const WINDOW_MS = 60 * 1000; // 1 Minute
const MAX_REQUESTS = 1; // STRICT: 1 request per minute

export async function POST(req: Request) {
    try {
        // 1. IP Rate Limiting
        const ip = req.headers.get("x-forwarded-for") || "unknown-ip";
        const now = Date.now();
        const record = rateLimitMap.get(ip);

        if (record) {
            if (now - record.startTime > WINDOW_MS) {
                rateLimitMap.set(ip, { count: 1, startTime: now });
            } else {
                if (record.count >= MAX_REQUESTS) {
                    // SILENT FAILURE: Do not let attacker know rate limit hit
                    console.log(`[Rate Limit] Blocked request from ${ip}`);
                    return NextResponse.json({ success: true });
                }
                record.count++;
            }
        } else {
            rateLimitMap.set(ip, { count: 1, startTime: now });
        }

        // 2. Generate Magic Token (JWT)
        const token = await new SignJWT({ role: 'admin' })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('5m') // Valid for 5 minutes
            .sign(SECRET_KEY);

        // 3. Construct Magic Link
        const origin = new URL(req.url).origin;
        const magicLink = `${origin}/api/admin/verify?token=${token}`;

        // 4. Send Email (Surgical Precision)
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: `"Nexus Security" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER, // ONLY send to admin
            subject: '🚨 SECURITY ALERT: Nexus Access Request',
            html: `
                <div style="background:#000; color:#0f0; padding:20px; font-family:monospace;">
                    <h2>NEXUS CONTROL SYSTEM</h2>
                    <p>An override sequence was initiated.</p>
                    <p><strong>Time:</strong> ${new Date().toISOString()}</p>
                    <p><strong>IP:</strong> ${ip}</p>
                    <br/>
                    <a href="${magicLink}" style="color:#fff; background:#d00; padding:10px 20px; text-decoration:none; display:inline-block; font-weight:bold;">
                        [ ACCESS DASHBOARD ]
                    </a>
                    <br/><br/>
                    <p style="color:#555; font-size:10px;">Link valid for 5 minutes.</p>
                </div>
            `,
        };

        await transporter.sendMail(mailOptions);
        console.log(`[Email Sent] Magic link dispatched to ${process.env.EMAIL_USER}`);

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("[Backend Error]", error);
        // Always return success to maintain stealth
        return NextResponse.json({ success: true });
    }
}
