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
      throw new Error('Forbidden');
    }

    const { params } = context as { params: { path: string[] } }

    // Base directory for images
    const safeBase = path.join(process.cwd(), 'uploads');
    const filePath = path.join(safeBase, ...params.path);

    // Prevent directory traversal
    if (!filePath.startsWith(safeBase)) {
      console.warn('[Image API] Attempted directory traversal:', filePath);
      throw new Error('Invalid path');
    }

    try {
      await fs.access(filePath);
    } catch (accessErr) {
      throw new Error('File not found');
    }

    const fileBuffer = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();

    const mimeTypes: Record<string, string> = {
      '.jpg':  'image/jpg',
      '.jpeg': 'image/jpeg',
      '.png':  'image/png',
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
    const host = req.headers.get('host');
    const protocol = req.headers.get('x-forwarded-proto') || 'https';
    const url = `${protocol}://${host}/forbidden`
    return NextResponse.redirect(url);
  }
}
