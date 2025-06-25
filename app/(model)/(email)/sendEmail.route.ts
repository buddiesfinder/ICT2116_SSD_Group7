import fetch from 'node-fetch';
import FormData from 'form-data';

// Define the attachment interface
export interface EmailAttachment {
  filename: string;
  content: string;
  encoding: 'base64';
  contentType: 'image/png' | 'image/jpeg' | 'application/pdf';
  cid?: string; // Optional for inline images
}

export async function sendEmailHandler(
  to: string,
  subject: string,
  body: string,
  attachments?: EmailAttachment[] // Changed from Blob to EmailAttachment[]
) {
  const form = new FormData();
  form.append('to', to);
  form.append('subject', subject);
  form.append('body', body);

  if (attachments && attachments.length > 0) {
    attachments.forEach((attachment, index) => {
      // Convert base64 to Buffer
      const buffer = Buffer.from(attachment.content, 'base64');
      
      // Create the attachment with proper options
      form.append(`attachment_${index}`, buffer, {
        filename: attachment.filename,
        contentType: attachment.contentType,
      });

      // If it's an inline image, add CID mapping for email clients that support it
      if (attachment.cid) {
        form.append(`cid_${index}`, attachment.cid);
      }
    });
  }

  const res = await fetch(process.env.EMAIL_API!, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.EMAIL_SECRET}`,
      ...form.getHeaders(), // adds Content-Length + multipart boundary
    },
    body: form,
  });

  // Robust parsing
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

// Helper function to determine content type from file extension
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