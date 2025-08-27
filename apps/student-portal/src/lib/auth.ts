import jwt from 'jsonwebtoken';

// JWT Secret should be in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

// Interface for token payloads
export interface TokenPayload {
    userId: number;
    uid?: string;
    email?: string;
    name: string;
    isAdmin?: boolean;
    iat?: number;
    exp?: number;
}

/**
 * Verify a JWT access token
 * @param token The JWT token to verify
 * @returns The decoded token payload or null if invalid
 */
export function verifyAccessToken(token: string): TokenPayload | null {
    try {
        if (!token || token === 'undefined' || token === 'null') {
            console.error("Invalid token provided:", token);
            return null;
        }

        // To debug token payload
        try {
            const decoded = jwt.decode(token);
            console.log("Token payload:", decoded);
        } catch {
            // Ignore decode errors
        }

        const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
        return decoded;
    } catch (error) {
        console.error("Error verifying access token:", error);
        return null;
    }
} 