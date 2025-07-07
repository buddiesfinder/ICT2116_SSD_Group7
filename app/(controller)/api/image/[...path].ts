import { NextApiRequest, NextApiResponse } from 'next'
import path from 'path'
import fs from 'fs'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { path: filePath = [] } = req.query;

  const fullPath = path.join(process.cwd(), 'uploads', ...(Array.isArray(filePath) ? filePath : [filePath]));

  if (!fs.existsSync(fullPath)) {
    res.status(404).send('Image not found');
    return;
  }

  const fileBuffer = fs.readFileSync(fullPath);
  const ext = path.extname(fullPath).toLowerCase();

  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
  };

  res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
  res.send(fileBuffer);
}
