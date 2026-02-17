import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    const response = NextResponse.redirect(new URL('/nexus-control', req.url));

    // Clear the session cookie
    response.cookies.delete('admin_session');

    return response;
}
