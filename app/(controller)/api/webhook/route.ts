import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/lib/db';
import QRCode from 'qrcode';
import { sendEmailHandler } from '@/app/(model)/(email)/sendEmail.route';

export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const signature = req.headers.get('stripe-signature');
  const body = await req.text();

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, signature!, endpointSecret);
    console.log('Webhook received:', event.type);
  } catch (err) {
    console.error('Stripe signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  //Payment Success
  if (event.type === 'checkout.session.completed') {
  const session = event.data.object as Stripe.Checkout.Session;
  const transaction_id = session.metadata?.transaction_id;

  if (!transaction_id) {
    console.warn('No transaction_id in metadata (completed)');
    return NextResponse.json({ error: 'Missing transaction_id' }, { status: 400 });
  }

  try {
    // 1. Update DB
    await db.query(
      `UPDATE Transaction SET status = 'paid', paid_at = NOW() WHERE transaction_id = ?`,
      [transaction_id]
    );

    await db.query(
      `UPDATE Booking SET status = 'paid' WHERE transaction_id = ?`,
      [transaction_id]
    );

    // 2. Fetch user email
    const [[userRow]]: any = await db.execute(
      `SELECT u.email 
       FROM Transaction t 
       JOIN User u ON t.user_id = u.user_id 
       WHERE t.transaction_id = ?`,
      [transaction_id]
    );

    const user_email = userRow?.email;

    if (!user_email) {
      console.warn('Email not found for transaction:', transaction_id);
      return NextResponse.json({ error: 'User email not found' }, { status: 404 });
    }

    // 3. Generate QR Code (encoded with transaction_id or booking URL)
    const qrContent = `${process.env.NEXT_PUBLIC_BASE_URL}/verify?transaction_id=${transaction_id}`;
    const qrDataURL = await QRCode.toDataURL(qrContent);
    const base64QR = qrDataURL.replace(/^data:image\/png;base64,/, '');

    // 4. Prepare HTML body with embedded image
    const emailHtml = `
        <h2>🎟️ Your Ticket Purchase is Confirmed!</h2>
        <p>Thank you for your purchase. Please find your QR code below:</p>
        <img src="cid:ticketqr" alt="QR Code" style="width: 200px; height: 200px;" />
        <p>Show this at the event entrance for verification.</p>
      `;
    

    // 5. Send email
    const emailResult = await sendEmailHandler(
        user_email,
        "Your Concert Ticket Confirmation",
        emailHtml,
        [
          {
            filename: "ticket.png",
            content: base64QR,
            encoding: "base64",
            contentType: "image/png",
            cid: "ticketqr"
          }
        ]
      );

      if (!emailResult.success) {
        console.error('Email failed:', emailResult.message);
      }

      console.log(`Confirmation email sent to ${user_email}`);
      return NextResponse.json({ received: true });

    } catch (dbError) {
      console.error('Error in post-payment email/QR:', dbError);
      return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
    }
}

  //Payment Timeout
  if (event.type === 'checkout.session.expired') {
    const session = event.data.object as Stripe.Checkout.Session;
    const transaction_id = session.metadata?.transaction_id;

    if (!transaction_id) {
      console.warn('No transaction_id in metadata (expired)');
      return NextResponse.json({ error: 'Missing transaction_id' }, { status: 400 });
    }

    try {
      // Mark transaction as expired
      await db.execute(
        `UPDATE Transaction SET status = 'expired' WHERE transaction_id = ? AND status = 'unpaid'`,
        [transaction_id]
      );

      // Restore seats
      const [bookings]: any = await db.execute(
        `SELECT seat_category_id, quantity, event_date_id FROM Booking WHERE transaction_id = ?`,
        [transaction_id]
      );

      for (const booking of bookings) {
        await db.execute(
          `UPDATE AvailableSeats
           SET available_seats = available_seats + ?
           WHERE seat_category_id = ? AND event_date_id = ?`,
          [booking.quantity, booking.seat_category_id, booking.event_date_id]
        );
      }

      // Mark bookings as expired
      await db.execute(
        `UPDATE Booking SET status = 'expired' WHERE transaction_id = ?`,
        [transaction_id]
      );

      console.log(`Transaction ${transaction_id} expired and seats restored.`);
    } catch (err) {
      console.error('Error handling session expiration:', err);
      return NextResponse.json({ error: 'Failed to clean up expired session' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}


