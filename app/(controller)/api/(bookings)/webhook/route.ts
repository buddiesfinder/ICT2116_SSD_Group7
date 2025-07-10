// /app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/lib/db';
import QRCode from 'qrcode';
import { sendEmailHandler } from '@/app/(model)/(email)/sendEmail.route';
import { markPaid } from '@/app/(model)/(bookings)/markPaid.route';
import { markExpiredAndRestoreSeats } from '@/app/(model)/(bookings)/markExpired.route';

export const config = { api: { bodyParser: false } };

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;


export async function POST(req: NextRequest) {
  // 1 ️⃣  Verify Stripe signature **first**. If this fails we never hit the DB.
  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing Stripe signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const body = await req.text();                // raw, unparsed body
    event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
  } catch (err) {
    console.error('Webhook verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // 2 ️⃣  Act only on the event types you expect.
  switch (event.type) {
    case 'checkout.session.completed': {
      const s = event.data.object as Stripe.Checkout.Session;

      // Guard against duplicate calls – don’t re‑write if already paid.
      const [ [row] ]: any = await db.execute(
        'SELECT status FROM Transaction WHERE transaction_id = ?',
        [s.metadata?.transaction_id],
      );
      if (row?.status === 'paid') break;

      const txId = s.metadata!.transaction_id;
      await markPaid(txId);

      const [[{ email }]]: any = await db.execute(
        `SELECT u.email
           FROM Transaction t JOIN User u ON t.user_id = u.user_id
          WHERE t.transaction_id = ?`,
        [txId],
      );

      const qr = await QRCode.toDataURL(
        `${process.env.NEXT_PUBLIC_BASE_URL}/verify?transaction_id=${txId}`,
      ).then(d => d.replace(/^data:image\/png;base64,/, ''));

      await sendEmailHandler(
        email,
        'Your Concert Ticket Confirmation',
        `<h2>🎟️  Your Ticket Purchase is Confirmed!</h2>
         <p>Thank you for your purchase. Please find your QR code below:</p>
         <p>Show this at the event entrance for verification.</p>`,
        [{ filename: 'ticket.png', content: qr, contentType: "image/png", encoding: 'base64', cid: 'ticketqr' }],
      );

      console.info(`Confirmation email sent to ${email}`);
      break;
    }

    case 'checkout.session.expired': {
      const s = event.data.object as Stripe.Checkout.Session;
      await markExpiredAndRestoreSeats(s.metadata!.transaction_id);
      console.info(`Transaction ${s.metadata!.transaction_id} expired and seats restored.`);
      break;
    }

    default:
      // Ignore all other event types
      break;
  }

  return NextResponse.json({ received: true });
}
