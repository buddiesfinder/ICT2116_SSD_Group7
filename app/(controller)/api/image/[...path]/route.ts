import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  try {
    // Join relative to /app (working dir)
    const filePath = path.join(process.cwd(), ...params.path)

    const fileBuffer = await fs.readFile(filePath)
    const ext = path.extname(filePath).toLowerCase()

    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
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
