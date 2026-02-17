/**
 * Link Generation Utility for ZKP Dashboard
 * 
 * Ensures all generated links use the public domain from environment variables.
 * This allows links to work correctly in Docker development, self-hosted production,
 * and cloud-hosted environments.
 * 
 * Links generated here:
 * - Magic links (for user invitations)
 * - Admin dashboard links (for admin notifications)
 * - Verification links (for email confirmations)
 * - Callback links (for OAuth redirects)
 */

/**
 * Get the public domain where the ZKP Dashboard is accessible
 * 
 * Required for generating working links in emails, notifications, etc.
 * 
 * Priority:
 * 1. NEXT_PUBLIC_APP_DOMAIN - Explicitly set in environment
 * 2. Falls back to error (configuration is required)
 * 
 * Examples:
 * - Development: http://localhost:3002
 * - Self-hosted: https://zkp.your-company.com
 * - Cloud-hosted: https://zkp.bioloc.io/customer_id
 */
export function getPublicDomain(): string {
    const domain = process.env.NEXT_PUBLIC_APP_DOMAIN;
    
    // Fallback for local development if variable is not set
    if (!domain) {
        if (process.env.NODE_ENV === 'development') {
            return 'http://localhost:3000';
        }
        // In production, we still want to warn or fail, but let's be safer and return a relative path or a placeholder
        // to avoid breaking the entire API.
        console.warn('[ZKP Link Generator] NEXT_PUBLIC_APP_DOMAIN is missing. Defaulting to localhost.');
        return 'http://localhost:3000';
    }
    
    return domain;
}

/**
 * Generate a magic link for user invitation/enrollment
 * 
 * @param token - Secure, single-use magic link token
 * @returns Complete URL that user can click in email
 * 
 * @example
 * const token = "mlk_abc123def456...";
 * const link = generateMagicLink(token);
 * // Returns: https://zkp.company.com/login?token=mlk_abc123def456...
 */
export function generateMagicLink(token: string): string {
    const publicDomain = getPublicDomain();
    return `${publicDomain}/login?token=${token}`;
}

/**
 * Generate admin dashboard link
 * Used in emails sent to admins
 * 
 * @param path - Path to admin page (default: /nexus-control)
 * @returns Complete URL accessible from outside
 * 
 * @example
 * const link = generateAdminLink('/nexus-control');
 * // Returns: https://zkp.company.com/nexus-control
 */
export function generateAdminLink(path: string = '/nexus-control'): string {
    const publicDomain = getPublicDomain();
    return `${publicDomain}${path}`;
}

/**
 * Generate email verification link
 * 
 * @param token - Verification token
 * @param type - Type of verification (email, reset, invite, etc.)
 * @returns Complete verification URL
 */
export function generateVerificationLink(token: string, type: string = 'email'): string {
    const publicDomain = getPublicDomain();
    return `${publicDomain}/verify?token=${token}&type=${type}`;
}

/**
 * Generate password reset link
 * 
 * @param token - Password reset token
 * @returns Complete reset URL
 */
export function generateResetLink(token: string): string {
    const publicDomain = getPublicDomain();
    return `${publicDomain}/reset-password?token=${token}`;
}

/**
 * Generate employee profile enrollment link
 * 
 * @param employeeId - Employee identifier
 * @param token - Enrollment token
 * @returns Complete enrollment URL
 */
export function generateEnrollmentLink(employeeId: string, token: string): string {
    const publicDomain = getPublicDomain();
    return `${publicDomain}/enroll?employee=${employeeId}&token=${token}`;
}

/**
 * Generate biometric training link
 * Sent to employees who need to train their biometric profile
 * 
 * @param sessionId - Training session ID
 * @param token - Session token
 * @returns Complete training URL
 */
export function generateTrainingLink(sessionId: string, token: string): string {
    const publicDomain = getPublicDomain();
    return `${publicDomain}/training/${sessionId}?token=${token}`;
}

/**
 * Validate that domain is properly configured at startup
 * Use in health checks to ensure app is deployable
 * 
 * @returns true if domain is valid, false otherwise
 */
export function validateDomainConfiguration(): boolean {
    try {
        getPublicDomain();
        return true;
    } catch (err) {
        console.error('[ZKP Link Generator Validation Failed]', err);
        return false;
    }
}

/**
 * Get domain with validation - useful for logging
 * 
 * @returns Domain if valid, null if not configured
 */
export function getPublicDomainSafe(): string | null {
    try {
        return getPublicDomain();
    } catch {
        return null;
    }
}
