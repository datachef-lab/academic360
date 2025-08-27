import { NextRequest, NextResponse } from 'next/server';

// Routes that map to restricted features
const FEATURE_ROUTES: Record<string, string> = {
    '/dashboard/course-catalogue': 'courseCatalogue',
    '/dashboard/library': 'library',
    '/dashboard/exams': 'exams',
    '/dashboard/documents': 'documents',
};

export function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    // Skip for non-restricted routes
    const restrictedFeature = Object.entries(FEATURE_ROUTES).find(([route]) =>
        pathname.startsWith(route)
    );

    if (!restrictedFeature) {
        return NextResponse.next();
    }

    // Get JWT from cookies instead of authorization header
    const accessToken = request.cookies.get('accessToken')?.value;

    if (!accessToken) {
        return NextResponse.next();
    }

    // For Edge Runtime, we'll handle access control on the client side
    // and we'll skip token verification in the middleware
    // The actual access control checks will happen in the API routes

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/dashboard/course-catalogue/:path*',
        '/dashboard/library/:path*',
        '/dashboard/exams/:path*',
        '/dashboard/documents/:path*',
    ],
};