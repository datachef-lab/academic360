import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { scanDocs, getFile } from '@/lib/services/docs.service';
import { verifyAccessToken } from '@/lib/services/auth';

// Utility function to verify if a path is within allowed directories
function isPathSafe(filePath: string): boolean {
    if (!process.env.DOCS_PATH) {
        console.error('DOCS_PATH environment variable not set');
        return false;
    }

    // Normalize paths to handle different path formats
    const normalizedFilePath = path.normalize(filePath);
    const normalizedDocsPath = path.normalize(process.env.DOCS_PATH);

    // Check if the file path starts with the docs path
    return normalizedFilePath.startsWith(normalizedDocsPath);
}

// Map file extensions to content types
const contentTypeMap: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.txt': 'text/plain',
};

export async function GET(request: NextRequest) {
    try {
        console.log('Document API request received:', request.nextUrl.toString());

        // Small delay to prevent rapid successive calls
        await new Promise(resolve => setTimeout(resolve, 100));

        // Get the authorization header or cookie
        const authHeader = request.headers.get('Authorization');
        const cookies = request.cookies;
        const accessTokenCookie = cookies.get('accessToken')?.value;
        const queryToken = request.nextUrl.searchParams.get('token');

        // Check for token in header, cookie, or query parameter
        let token: string | undefined;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
            console.log('Using token from Authorization header');
        } else if (accessTokenCookie) {
            token = accessTokenCookie;
            console.log('Using token from cookie');
        } else if (queryToken) {
            token = queryToken;
            console.log('Using token from query parameter');
        }

        if (!token) {
            console.log('No authentication token found');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify the token
        const payload = verifyAccessToken(token);

        if (!payload) {
            console.log('Invalid authentication token');
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        console.log('Authenticated user:', payload.name, '(ID:', payload.userId, ')');

        // Get query parameters
        const rollNumber = request.nextUrl.searchParams.get('rollNumber');
        const stream = request.nextUrl.searchParams.get('stream');
        const filePath = request.nextUrl.searchParams.get('filePath');
        const disposition = request.nextUrl.searchParams.get('disposition') || 'inline'; // Default to inline for preview
        const framework = request.nextUrl.searchParams.get('framework'); // Optional framework parameter

        // Log query parameters for debugging
        console.log('Query parameters:', { rollNumber, stream, framework, disposition });

        // Get single file if filePath is provided
        if (filePath) {
            console.log('Requesting specific file:', filePath);

            // Decode the URL-encoded file path
            const decodedPath = decodeURIComponent(filePath);

            // Security check - ensure it's a legitimate path
            if (!isPathSafe(decodedPath)) {
                console.error('Invalid file path access attempt:', decodedPath);
                return NextResponse.json({ error: 'Invalid file path' }, { status: 403 });
            }

            // Get the file
            const fileBuffer = await getFile(decodedPath);

            if (!fileBuffer) {
                console.log('File not found:', decodedPath);
                return NextResponse.json({ error: 'File not found' }, { status: 404 });
            }

            // Set filename for download
            const filename = path.basename(decodedPath);

            // Get file extension for content type
            const ext = path.extname(decodedPath).toLowerCase();
            let contentType = 'application/octet-stream'; // Default

            // Set appropriate content type based on file extension
            if (ext in contentTypeMap) {
                contentType = contentTypeMap[ext];
            }

            // Set content disposition based on parameter (inline for preview, attachment for download)
            const contentDisposition = disposition === 'attachment'
                ? `attachment; filename="${filename}"`
                : `inline; filename="${filename}"`;

            console.log('Serving file:', filename, 'Content-Type:', contentType, 'Disposition:', disposition);

            // Create headers with additional settings for better PDF viewing
            const headers: HeadersInit = {
                'Content-Type': contentType,
                'Content-Disposition': contentDisposition,
            };

            // Add additional headers for PDFs to improve viewing experience
            if (contentType === 'application/pdf' && disposition === 'inline') {
                // Add caching headers to improve performance
                headers['Cache-Control'] = 'public, max-age=3600';
                // Add security headers
                headers['X-Content-Type-Options'] = 'nosniff';
                // Cross-origin headers to allow embedding
                headers['Cross-Origin-Resource-Policy'] = 'cross-origin';
                headers['X-Frame-Options'] = 'SAMEORIGIN';
                // Allow embedding in iframes from same origin
                headers['Content-Security-Policy'] = "default-src 'self'; object-src 'self'; frame-ancestors 'self'";
                // Allow PDF.js to render the PDF as well
                headers['Access-Control-Allow-Origin'] = '*';
            }

            // For file downloads, make sure the correct content disposition is set
            if (disposition === 'attachment') {
                // Force the browser to download the file instead of trying to display it
                headers['Content-Type'] = 'application/octet-stream';
            } else if (contentType === 'application/pdf') {
                // Clean PDF display for viewers
                headers['X-Frame-Options'] = 'ALLOWALL';
                headers['Access-Control-Allow-Origin'] = '*';
            }

            // Return file as a stream
            return new NextResponse(fileBuffer, { headers });
        }

        // List available documents if no filePath is provided
        console.log('Scanning for documents with:', { rollNumber, stream });

        if (!rollNumber || !stream) {
            console.log('Missing required parameters');
            return NextResponse.json(
                { error: 'Roll number and stream are required' },
                { status: 400 }
            );
        }

        // Validate stream parameter
        const validStreams = ['BCOM', 'BA', 'BSC', 'MCOM', 'MA', 'BBA'];
        if (!validStreams.includes(stream)) {
            console.log('Invalid stream:', stream);
            return NextResponse.json(
                { error: 'Invalid stream. Valid options are: BCOM, BA, BSC, MCOM, MA, BBA' },
                { status: 400 }
            );
        }

        // Get optional registrationNumber
        const registrationNumber = request.nextUrl.searchParams.get('registrationNumber') || "";

        // Convert framework parameter to the correct type
        const frameworkValue = framework || undefined;

        // Scan for available documents
        const documents = await scanDocs(
            rollNumber,
            stream as "BCOM" | "BA" | "BSC" | "MCOM" | "MA" | "BBA",
            registrationNumber,
            frameworkValue
        );

        console.log(`Found ${documents.length} documents for student`);

        // If no documents found
        if (documents.length === 0) {
            return NextResponse.json({
                message: 'No documents found for the provided details',
                documents: []
            });
        }

        // Return the list of documents without the actual files
        return NextResponse.json({
            message: `Found ${documents.length} document(s)`,
            documents: documents.map(doc => ({
                filePath: doc.filePath,
                semester: doc.semester,
                type: doc.type,
                fileName: path.basename(doc.filePath),
                framework: doc.framework,
                year: doc.year
            }))
        });

    } catch (error) {
        console.error('Error in docs API:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
} 