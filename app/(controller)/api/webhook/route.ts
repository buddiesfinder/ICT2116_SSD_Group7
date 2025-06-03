import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/lib/db';

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
      await db.query(
        `UPDATE Transaction SET status = 'paid', paid_at = NOW() WHERE transaction_id = ?`,
        [transaction_id]
      );

      await db.query(
        `UPDATE Booking SET status = 'paid' WHERE transaction_id = ?`,
        [transaction_id]
      );

      console.log(`Transaction ${transaction_id} marked as paid.`);
    } catch (dbError) {
      console.error('DB error updating payment status:', dbError);
      return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
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
      await db.query(
        `UPDATE Transaction SET status = 'expired' WHERE transaction_id = ? AND status = 'unpaid'`,
        [transaction_id]
      );

      // Restore seats
      const [bookings]: any = await db.query(
        `SELECT seat_category_id, quantity, event_date_id FROM Booking WHERE transaction_id = ?`,
        [transaction_id]
      );

      for (const booking of bookings) {
        await db.query(
          `UPDATE AvailableSeats
           SET available_seats = available_seats + ?
           WHERE seat_category_id = ? AND event_date_id = ?`,
          [booking.quantity, booking.seat_category_id, booking.event_date_id]
        );
      }

      // Mark bookings as expired
      await db.query(
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
