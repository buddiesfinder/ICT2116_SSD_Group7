// pages/api/uploads/[...slug].ts
import path from 'path';
import fs from 'fs';
import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { slug = [] } = req.query;
  const filePath = path.join(process.cwd(), 'uploads', ...slug);

  if (!fs.existsSync(filePath)) {
    res.status(404).send('File not found');
    return;
  }

  const fileStream = fs.createReadStream(filePath);
  res.setHeader('Content-Type', 'image/*'); // or infer type dynamically
  fileStream.pipe(res);
}
