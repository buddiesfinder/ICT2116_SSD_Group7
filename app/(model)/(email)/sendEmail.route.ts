import fetch from 'node-fetch'; // ⬅ override global fetch
import FormData from 'form-data';


export async function sendEmailHandler(
  to: string,
  subject: string,
  body: string,
  attachment?: Blob
) {                              
  const form = new FormData();
  form.append('to', to);
  form.append('subject', subject);
  form.append('body', body);
  if (attachment) form.append('attachment', attachment, (attachment as any).name);

  const res = await fetch(process.env.EMAIL_API!, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.EMAIL_SECRET}`,
      ...form.getHeaders(),        // ← adds Content-Length + multipart boundary
    },
    body: form,
  });

  // ------------- new robust parsing -------------
  const raw = await res.text();    // works for both plain text OR JSON
  let parsed: any;
  try { parsed = JSON.parse(raw); } catch { parsed = {}; }

  return {
    success: res.ok,
    message: parsed.message ?? raw.trim(),
  } as const;
}
