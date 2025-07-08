import { NextRequest, NextResponse } from 'next/server';
import { verifyJwt } from '@/lib/jwt';
import { db } from '@/lib/db';
import Stripe from 'stripe';
import { verifyRefreshToken } from '@/app/(model)/(auth)/(token)/verifyRefreshToken.route';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tickets, event_date_id } = body;

    if (!tickets || !Array.isArray(tickets) || tickets.length === 0) {
      return NextResponse.json({ success: false, message: 'No tickets selected' }, { status: 400 });
    }

    const refreshToken = req.cookies.get('refresh_token')?.value;
    if (!refreshToken) {
      return NextResponse.json({ success: false, message: 'Missing token' }, { status: 401 });
    }

    const {success, message, payload } = await verifyRefreshToken (refreshToken);

    if (!success) {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 403 });
    }

    if (payload.role != 'procurer') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const user_id = payload.userId;
    let totalAmount = 0;

    // Validate ticket prices from database
    for (const ticket of tickets) {
      const [res]: any = await db.execute(
        `SELECT price FROM SeatCategory WHERE seat_category_id = ?`,
        [ticket.seat_category_id]
      );

      const dbPrice = res?.[0]?.price;
      if (dbPrice === undefined || dbPrice != ticket.price) {
        return NextResponse.json({
          success: false,
          message: `Price mismatch for category ${ticket.category_name}`,
        }, { status: 400 });
      }

      totalAmount += ticket.quantity * dbPrice;
    }

    // Insert Transaction
    const [txnRes]: any = await db.execute(
      `INSERT INTO Transaction (user_id, amount, status) VALUES (?, ?, 'unpaid')`,
      [user_id, totalAmount]
    );
    const transaction_id = txnRes.insertId;

    const bookingIds: number[] = [];

    // Create bookings and update seat availability
    for (const ticket of tickets) {
      // Check availability
      const [availabilityRes]: any = await db.execute(
        `SELECT available_seats FROM AvailableSeats
         WHERE event_date_id = ? AND seat_category_id = ?`,
        [event_date_id, ticket.seat_category_id]
      );

      const available = availabilityRes?.[0]?.available_seats ?? 0;
      if (available < ticket.quantity) {
        return NextResponse.json({
          success: false,
          message: `Not enough seats for ${ticket.category_name}`,
        }, { status: 400 });
      }

      const amountPayable = ticket.price * ticket.quantity;

      // Insert booking
      const [bookingRes]: any = await db.execute(
        `INSERT INTO Booking (transaction_id, user_id, event_id, quantity, status, amount_payable, booked_at, redeemed, seat_category_id, event_date_id)
         VALUES (?, ?, ?, ?, 'reserved', ?, NOW(), 'no', ?, ?)`,
        [
          transaction_id,
          user_id,
          ticket.event_id,
          ticket.quantity,
          amountPayable,
          ticket.seat_category_id,
          event_date_id
        ]
      );

      bookingIds.push(bookingRes.insertId);

      // Decrement availability
      await db.execute(
        `UPDATE AvailableSeats
         SET available_seats = available_seats - ?
         WHERE event_date_id = ? AND seat_category_id = ?`,
        [ticket.quantity, event_date_id, ticket.seat_category_id]
      );
    }

    // Create Stripe line items
    const line_items = tickets.map((ticket: any) => ({
      price_data: {
        currency: 'sgd',
        product_data: {
          name: `${ticket.category_name} Ticket`,
        },
        unit_amount: ticket.price * 100, // cents
      },
      quantity: ticket.quantity,
    }));

    // Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success_payment`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/cancel?transaction_id=${transaction_id}`,
      expires_at: Math.floor(Date.now() / 1000) + 1800, // 30 minutes
      metadata: {
        booking_ids: bookingIds.join(','),
        transaction_id: transaction_id.toString(),
        user_id: user_id.toString(),
      },
    });

    return NextResponse.json({ success: true, url: session.url });
  } catch (err: any) {
    console.error('Checkout error:', err);
    return NextResponse.json({
      success: false,
      message: err.message || 'Server error during checkout',
    }, { status: 500 });
  }
}
