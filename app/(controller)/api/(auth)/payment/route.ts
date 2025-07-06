import { NextRequest, NextResponse } from 'next/server';
import { verifyJwt } from '@/lib/jwt';
import Stripe from 'stripe';
import { db } from '@/lib/db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tickets, event_date_id } = body;

    if (!tickets || !Array.isArray(tickets) || tickets.length === 0) {
      return NextResponse.json({ success: false, message: 'No tickets selected' }, { status: 400 });
    }

    const refreshToken = request.cookies.get('refresh_token')?.value;
    if (!refreshToken) {
      return NextResponse.json({ success: false, message: 'No token' }, { status: 401 });
    }

    const user = verifyJwt(refreshToken, process.env.REFRESH_JWT!);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 403 });
    }

    const user_id = user.userId;
    if (!user_id) {
      return NextResponse.json({ success: false, message: 'Missing user_id in token' }, { status: 400 });
    }

    let totalAmount = 0;
    const bookingIds: number[] = [];
    const validatedTickets: any[] = [];

    for (const ticket of tickets) {
      // Fetch actual price from DB
      const [priceResult]: any = await db.execute(
        `SELECT price FROM SeatCategory WHERE event_id = ? AND category_id = ?`,
        [ticket.event_id, ticket.seat_category_id]
      );

      const serverPrice = priceResult[0]?.price;
      if (!serverPrice) {
        return NextResponse.json({
          success: false,
          message: `Seat category does not exist for event ${ticket.event_id}`,
        }, { status: 400 });
      }

      if (parseFloat(ticket.price) !== parseFloat(serverPrice)) {
        return NextResponse.json({
          success: false,
          message: `Price mismatch detected for ${ticket.category_name}`,
        }, { status: 400 });
      }

      const amountPayable = parseFloat(serverPrice) * ticket.quantity;
      totalAmount += amountPayable;

      // Check available seats
      const [availableResult]: any = await db.execute(
        `SELECT available_seats FROM AvailableSeats WHERE event_date_id = ? AND seat_category_id = ?`,
        [event_date_id, ticket.seat_category_id]
      );

      const available = availableResult[0]?.available_seats ?? 0;
      if (available < ticket.quantity) {
        return NextResponse.json({
          success: false,
          message: `Not enough seats available for ${ticket.category_name}`,
        }, { status: 400 });
      }

      // Insert booking
      const [bookingResult]: any = await db.execute(
        `INSERT INTO Booking (transaction_id, user_id, event_id, quantity, status, amount_payable, booked_at, redeemed, seat_category_id, event_date_id)
         VALUES (?, ?, ?, ?, 'reserved', ?, NOW(), 'no', ?, ?)`,
        [0, user_id, ticket.event_id, ticket.quantity, amountPayable, ticket.seat_category_id, event_date_id] // temporary 0 for transaction_id
      );

      bookingIds.push(bookingResult.insertId);
      validatedTickets.push({ ...ticket, price: parseFloat(serverPrice) });

      await db.execute(
        `UPDATE AvailableSeats SET available_seats = available_seats - ? WHERE event_date_id = ? AND seat_category_id = ?`,
        [ticket.quantity, event_date_id, ticket.seat_category_id]
      );
    }

    const [transactionResult]: any = await db.execute(
      `INSERT INTO Transaction (user_id, amount, status) VALUES (?, ?, 'unpaid')`,
      [user_id, totalAmount]
    );

    const transaction_id = transactionResult.insertId;

    // Update bookings with actual transaction_id
    for (const bookingId of bookingIds) {
      await db.execute(`UPDATE Booking SET transaction_id = ? WHERE booking_id = ?`, [transaction_id, bookingId]);
    }

    const line_items = validatedTickets.map((ticket) => ({
      price_data: {
        currency: 'sgd',
        product_data: {
          name: `${ticket.category_name} Ticket`,
        },
        unit_amount: ticket.price * 100,
      },
      quantity: ticket.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success_payment`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/cancel?transaction_id=${transaction_id}`,
      expires_at: Math.floor(Date.now() / 1000) + 1800,
      metadata: {
        booking_ids: bookingIds.join(','),
        transaction_id: transaction_id.toString(),
      },
    });

    return NextResponse.json({ success: true, url: session.url });
  } catch (error: any) {
    console.error('Stripe Checkout Error:', error);
    return NextResponse.json({ success: false, message: 'Something went wrong' }, { status: 500 });
  }
}
