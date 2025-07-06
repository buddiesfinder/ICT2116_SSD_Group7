import fs from 'fs';
import path from 'path';
import mime from 'mime';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { slug = [] } = req.query;

  // Ensure array
  const slugArray = Array.isArray(slug) ? slug : [slug];

  // Build absolute path
  const filePath = path.join('/app/uploads', ...slugArray);

  console.log('Serving file from:', filePath);

  if (!fs.existsSync(filePath)) {
    res.status(404).send('File not found');
    return;
  }

  const mimeType = mime.getType(filePath) || 'application/octet-stream';
  res.setHeader('Content-Type', mimeType);

  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
}
