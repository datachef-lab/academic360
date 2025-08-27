import { NextRequest } from "next/server";
import { verifyAccessToken } from "./services/auth";

/**
 * Validates if the current user is an admin
 * @param request The incoming request
 * @returns boolean indicating if the user is an admin
 */
export async function validateAdmin(request: NextRequest): Promise<boolean> {
    try {
        // Get the authorization header
        const authHeader = request.headers.get("authorization");

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return false;
        }

        // Extract token
        const token = authHeader.split(" ")[1];

        // Verify token
        const payload = verifyAccessToken(token);

        if (!payload) {
            return false;
        }

        // Check if user is admin
        return payload.isAdmin === true;
    } catch (error) {
        console.error("Error validating admin:", error);
        return false;
    }
} 