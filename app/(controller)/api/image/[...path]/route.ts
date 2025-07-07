import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

// This route uses fs and path, so we must run under the Node.js runtime
export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Prevent directory traversal by resolving against a safe base directory
    // (e.g. your project's "public" folder)
    const safeBase = path.join(process.cwd(), 'public')
    const filePath = path.join(safeBase, ...params.path)
    if (!filePath.startsWith(safeBase)) {
      // attempted to escape the public directory
      throw new Error('Invalid path')
    }

    const fileBuffer = await fs.readFile(filePath)
    const ext = path.extname(filePath).toLowerCase()

    const mimeTypes: Record<string, string> = {
      '.jpg':  'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png':  'image/png',
      '.gif':  'image/gif',
      '.webp': 'image/webp',
    }

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': mimeTypes[ext] || 'application/octet-stream',
      },
    })
  } catch (err) {
    console.error('Image fetch error:', err)
    return new NextResponse('Image not found', { status: 404 })
  }
}
