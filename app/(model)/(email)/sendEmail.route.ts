import fetch from 'node-fetch';
import FormData from 'form-data';

export interface EmailAttachment {
  filename: string;
  content: string; // base64 string, optionally with data URI prefix
  encoding: 'base64';
  contentType: 'image/png' | 'image/jpeg' | 'application/pdf';
  cid?: string; // optional content-id for inline images
}

export async function sendEmailHandler(
  to: string,
  subject: string,
  body: string,
  attachments?: EmailAttachment[]
) {
  const form = new FormData();
  form.append('to', to);
  form.append('subject', subject);
  form.append('body', body);

  if (attachments && attachments.length > 0) {
    attachments.forEach((attachment, index) => {
      // Strip data URI prefix if present
      const base64Data = attachment.content.replace(/^data:.*;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      // Append attachment with knownLength and optional cid
      const attachmentOptions: any = {
        filename: attachment.filename,
        contentType: attachment.contentType,
        knownLength: buffer.length,
      };
      if (attachment.cid) {
        attachmentOptions.cid = attachment.cid;
        // Optionally set disposition inline if cid is present
        attachmentOptions.contentDisposition = 'inline';
      }

      form.append(`attachment`, buffer, attachmentOptions);
    });
  }

  const res = await fetch(process.env.EMAIL_API!, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.EMAIL_SECRET}`,
      ...form.getHeaders(),
    },
    body: form,
  });

  const raw = await res.text();
  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = {};
  }

  return {
    success: res.ok,
    message: parsed.message ?? raw.trim(),
  } as const;
}

// Helper function to determine content type from filename
export function getContentTypeFromFilename(filename: string): EmailAttachment['contentType'] {
  const ext = filename.toLowerCase().split('.').pop();
  switch (ext) {
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'pdf':
      return 'application/pdf';
    default:
      return 'image/png'; // Default fallback
  }
}