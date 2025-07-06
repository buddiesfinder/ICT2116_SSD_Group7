import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import mime from 'mime-types';

// Type-safe param context using `RequestHandler`
export async function GET(
  req: NextRequest,
  context: { params: Record<'filename', string> }
) {
  const filename = context.params.filename;
  const filePath = path.join(process.cwd(), 'uploads', filename);

  if (!fs.existsSync(filePath)) {
    return new NextResponse('File not found', { status: 404 });
  }

  const fileBuffer = fs.readFileSync(filePath);
  const contentType = mime.lookup(filePath) || 'application/octet-stream';

  return new NextResponse(fileBuffer, {
    status: 200,
    headers: {
      'Content-Type': contentType,
    },
  });
}
