import { db } from '@/lib/db';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function processBooking({
  user_id,
  tickets,
  event_date_id,
  baseUrl,
}: {
  user_id: number;
  tickets: any[];
  event_date_id: number;
  baseUrl: string;
}) {
  let totalAmount = 0;
  const bookingIds: number[] = [];

  // Validate ticket prices from database & calculate total
  for (const ticket of tickets) {
    const [res]: any = await db.execute(
      `SELECT price FROM SeatCategory WHERE seat_category_id = ?`,
      [ticket.seat_category_id]
    );

    const dbPrice = res?.[0]?.price;
    if (dbPrice === undefined || dbPrice != ticket.price) {
      throw new Error(`Price mismatch for category ${ticket.category_name}`);
    }

    totalAmount += ticket.quantity * dbPrice;
  }

  // Insert Transaction
  const [txnRes]: any = await db.execute(
    `INSERT INTO Transaction (user_id, amount, status) VALUES (?, ?, 'unpaid')`,
    [user_id, totalAmount]
  );
  const transaction_id = txnRes.insertId;

  // Create bookings and update availability
  for (const ticket of tickets) {
    // Check availability
    const [availabilityRes]: any = await db.execute(
      `SELECT available_seats FROM AvailableSeats
       WHERE event_date_id = ? AND seat_category_id = ?`,
      [event_date_id, ticket.seat_category_id]
    );

    const available = availabilityRes?.[0]?.available_seats ?? 0;
    if (available < ticket.quantity) {
      throw new Error(`Not enough seats for ${ticket.category_name}`);
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
        event_date_id,
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
  const line_items = tickets.map((ticket) => ({
    price_data: {
      currency: 'sgd',
      product_data: {
        name: `${ticket.category_name} Ticket`,
      },
      unit_amount: ticket.price * 100, // in cents
    },
    quantity: ticket.quantity,
  }));

  // Create Stripe checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items,
    mode: 'payment',
    success_url: `${baseUrl}/success_payment`,
    cancel_url: `${baseUrl}/cancel?transaction_id=${transaction_id}`,
    expires_at: Math.floor(Date.now() / 1000) + 1800, // 30 minutes expiry
    metadata: {
      booking_ids: bookingIds.join(','),
      transaction_id: transaction_id.toString(),
      user_id: user_id.toString(),
    },
  });

  return { sessionUrl: session.url };
}
