import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

// Ensure this runs in Node runtime to allow fs/path usage
export const runtime = 'nodejs'

export async function GET(
  req: NextRequest,
  context: any
) {
  try {
    const internalHeader = req.headers.get('x-internal-request');
    if (internalHeader !== 'true') {
      console.warn('[Image API] Blocked direct acess without x-internal-request header');
      return NextResponse.redirect('/forbidden', 302);
    }

    const { params } = context as { params: { path: string[] } }

    console.log('[Image API] Params:', params.path);

    // Base directory for images
    const safeBase = path.join(process.cwd(), 'uploads');
    const filePath = path.join(safeBase, ...params.path);

    console.log('[Image API] Resolved file path:', filePath);

    // Prevent directory traversal
    if (!filePath.startsWith(safeBase)) {
      console.warn('[Image API] Attempted directory traversal:', filePath);
      throw new Error('Invalid path');
    }

    try {
      await fs.access(filePath);
    } catch (accessErr) {
      console.error('[Image API] Access error: ', filePath, accessErr);
      throw new Error('File not found');
    }

    const fileBuffer = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();

    const mimeTypes: Record<string, string> = {
      '.jpg':  'image/jpg',
      '.jpeg': 'image/jpeg',
      '.png':  'image/png',
      '.gif':  'image/gif',
      '.webp': 'image/webp',
    };

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': mimeTypes[ext] || 'application/octet-stream',
      },
    });
  } catch (err) {
    console.error('[Image API] Image fetch error:', err);
    return NextResponse.json({ success: false, message: 'No image.' },{ status: 400 });
  }
}
