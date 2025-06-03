import { NextRequest, NextResponse } from 'next/server';
import { verifyJwt } from '@/lib/jwt';
import Stripe from 'stripe';
import { db } from '@/lib/db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
    try {
        
        //Parse the request body (tickets + event_date_id)
        const body = await request.json();
        const { tickets, event_date_id } = body;

        if (!tickets || !Array.isArray(tickets) || tickets.length === 0) {
        return NextResponse.json({ success: false, message: 'No tickets selected' }, { status: 400 });
        }

        // Temporary fixed user ID (replace later when you implement auth)
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

        //Calculate total transaction amount
        const totalAmount = tickets.reduce((sum, ticket) => {
        return sum + ticket.price * ticket.quantity;
        }, 0);

        //Create new transaction record
        const [transactionResult]: any = await db.query(
        `INSERT INTO Transaction (user_id, amount, status) VALUES (?, ?, 'unpaid')`,
        [user_id, totalAmount]
        );

        const transaction_id = transactionResult.insertId;
        // Insert booking records and keep track of inserted IDs
        const bookingIds: number[] = [];

        for (const ticket of tickets) {
            const amountPayable = ticket.price * ticket.quantity;

            // 1. Check available seats
            const [availableResult]: any = await db.query(
                `SELECT available_seats 
                FROM AvailableSeats 
                WHERE event_date_id = ? AND seat_category_id = ?`,
                [event_date_id, ticket.seat_category_id]
            );

            const available = availableResult[0]?.available_seats ?? 0;

            if (available < ticket.quantity) {
                return NextResponse.json({
                success: false,
                message: `Not enough seats available for ${ticket.category_name}`,
                }, { status: 400 });
            }

            // 2. Insert booking
            const [bookingResult]: any = await db.query(
                `INSERT INTO Booking 
                (transaction_id, user_id, event_id, quantity, status, amount_payable, booked_at, redeemed, seat_category_id, event_date_id)
                VALUES (?, ?, ?, ?, 'confirmed', ?, NOW(), 'no', ?, ?)`,
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

            bookingIds.push(bookingResult.insertId);

            // 3. Update available seats
            await db.query(
                `UPDATE AvailableSeats
                SET available_seats = available_seats - ?
                WHERE event_date_id = ? AND seat_category_id = ?`,
                [ticket.quantity, event_date_id, ticket.seat_category_id]
            );
            }

        //Prepare Stripe line items
        const line_items = tickets.map((ticket: any) => ({
        price_data: {
            currency: 'sgd',
            product_data: {
            name: `${ticket.category_name} Ticket`,
            },
            unit_amount: ticket.price * 100, // Stripe uses cents
        },
        quantity: ticket.quantity,
        }));

        //Create Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items,
        mode: 'payment',
        success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success_payment`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/cancel`,
        metadata: {
            booking_ids: bookingIds.join(','),
            transaction_id: transaction_id.toString(),
            },
        });

        return NextResponse.json({ success: true, url: session.url });
            
    }catch (error: any) {
        console.error('Stripe Checkout Error:', error);
        return NextResponse.json({ success: false, message: 'Something went wrong' }, { status: 500 });
    }
} 