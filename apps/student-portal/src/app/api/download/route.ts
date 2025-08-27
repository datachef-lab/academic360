import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { stat, readFile } from 'fs/promises';

export async function GET(request: NextRequest) {
    try {
        // Get file path from the query string
        const filePath = request.nextUrl.searchParams.get('filePath');

        if (!filePath) {
            return NextResponse.json({ error: 'File path is required' }, { status: 400 });
        }

        // Decode the URL-encoded file path
        const decodedPath = decodeURIComponent(filePath);

        console.log('Requested file path:', decodedPath);

        // For security, ensure the filePath contains 'course-materials' somewhere in the path
        if (!decodedPath.includes('course-materials')) {
            console.error('Invalid file path - missing course-materials in path:', decodedPath);
            return NextResponse.json({ error: 'Invalid file path' }, { status: 403 });
        }

        // Use the original path if it's an absolute path
        // (useful for paths stored in the database that might be absolute)
        let absolutePath = decodedPath;

        // If it's not an absolute path, resolve it relative to the current working directory
        if (!path.isAbsolute(decodedPath)) {
            absolutePath = path.resolve(process.cwd(), decodedPath);
        }

        console.log('Resolved absolute path:', absolutePath);

        // Check if file exists
        try {
            await stat(absolutePath);
        } catch (err) {
            console.error('File not found:', absolutePath, err);
            return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }

        // Get file extension for content type
        const ext = path.extname(absolutePath).toLowerCase();
        let contentType = 'application/octet-stream'; // Default

        // Set appropriate content type based on file extension
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

        if (ext in contentTypeMap) {
            contentType = contentTypeMap[ext];
        }

        // Read file
        const fileBuffer = await readFile(absolutePath);

        // Set filename for download
        const filename = path.basename(absolutePath);

        // Return file as a stream
        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        });
    } catch (error) {
        console.error('Error in download API:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
} 