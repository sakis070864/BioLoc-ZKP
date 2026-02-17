import { NextResponse } from 'next/server';
import { validateDomainConfiguration, getPublicDomainSafe } from '@/lib/link-generator';

export async function GET() {
    const isDomainConfigured = validateDomainConfiguration();
    const domain = getPublicDomainSafe();

    if (!isDomainConfigured) {
        return NextResponse.json(
            {
                status: 'unhealthy',
                error: 'NEXT_PUBLIC_APP_DOMAIN environment variable is not set',
                message: 'Links cannot be generated. Check your Docker environment variables.',
                timestamp: new Date().toISOString()
            },
            { status: 503 }
        );
    }

    return NextResponse.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        domain: domain,
        service: 'zkp-dashboard',
        version: '1.0.0'
    }, { status: 200 });
}
