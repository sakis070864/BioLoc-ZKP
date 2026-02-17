import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { generateAdminLink } from '@/lib/link-generator';

// Simple In-Memory Rate Limiter
const rateLimitMap = new Map<string, { count: number, startTime: number }>();
const WINDOW_MS = 60 * 60 * 1000; // 1 Hour
const MAX_REQUESTS = 3;

export async function POST(req: Request) {
    try {
        const ip = req.headers.get("x-forwarded-for") || "unknown-ip";
        const now = Date.now();
        const record = rateLimitMap.get(ip);

        if (record) {
            if (now - record.startTime > WINDOW_MS) {
                rateLimitMap.set(ip, { count: 1, startTime: now });
            } else {
                if (record.count >= MAX_REQUESTS) {
                    return NextResponse.json({ error: "Rate limit exceeded. Try again later." }, { status: 429 });
                }
                record.count++;
            }
        } else {
            rateLimitMap.set(ip, { count: 1, startTime: now });
        }

        const { email, name, company } = await req.json();

        if (!email || !company) {
            return NextResponse.json({ error: 'Email and Company are required' }, { status: 400 });
        }

        // Configure Transporter (Gmail)
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        // Generate admin link using public domain from environment
        const adminLink = generateAdminLink('/nexus-control');

        // Email Content
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER, // Send TO yourself
            subject: '🔒 New Access Request - ZKP Security',
            html: `
    <div style="font-family: monospace; background: #0f172a; color: #fff; padding: 20px;">
        <h2 style="color: #22d3ee;"> New Access Request </h2>
            <p> A user has requested access to the BioLock ZKP System.</p>
                <hr style="border-color: #334155;">
                    <p><strong>Name: </strong> ${name || 'Not Provided'}</p>
                        <p><strong>Company: </strong> ${company}</p>
                            <p><strong>Email: </strong> ${email}</p>
                                <p><strong>Timestamp: </strong> ${new Date().toLocaleString()}</p>
                                    <br>
                                    <a href="${adminLink}" style="color: #22d3ee;"> Go to Command Nexus </a>
                                        </div>
                                            `,
        };

        await transporter.sendMail(mailOptions);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Email Error:', error);
        return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }
}
