// /app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/lib/db';
import QRCode from 'qrcode';
import { sendEmailHandler } from '@/app/(model)/(email)/sendEmail.route';

export const config = { api: { bodyParser: false } };

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

async function markPaid(transactionId: string) {
  await db.execute(
    `UPDATE Transaction SET status = 'paid', paid_at = NOW() WHERE transaction_id = ?`,
    [transactionId],
  );
  await db.execute(
    `UPDATE Booking SET status = 'paid' WHERE transaction_id = ?`,
    [transactionId],
  );
}

async function markExpiredAndRestoreSeats(transactionId: string) {
  await db.execute(
    `UPDATE Transaction SET status = 'expired' WHERE transaction_id = ? AND status = 'unpaid'`,
    [transactionId],
  );
  const [bookings]: any = await db.execute(
    `SELECT seat_category_id, quantity, event_date_id FROM Booking WHERE transaction_id = ?`,
    [transactionId],
  );
  for (const b of bookings)
    await db.execute(
      `UPDATE AvailableSeats
       SET available_seats = available_seats + ?
       WHERE seat_category_id = ? AND event_date_id = ?`,
      [b.quantity, b.seat_category_id, b.event_date_id],
    );
  await db.execute(
    `UPDATE Booking SET status = 'expired' WHERE transaction_id = ?`,
    [transactionId],
  );
}

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
         <img src="cid:ticketqr" alt="QR Code" style="width:200px;height:200px;" />
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
