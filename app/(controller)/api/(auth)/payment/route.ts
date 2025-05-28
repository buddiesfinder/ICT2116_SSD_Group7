import { NextRequest, NextResponse } from 'next/server';
import { verifyJwt } from '@/lib/jwt';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
    try {
        
        //Parse the request body (tickets + event_date_id)
        const body = await request.json();
        const { tickets, event_date_id } = body;

        if (!tickets || !Array.isArray(tickets) || tickets.length === 0) {
        return NextResponse.json({ success: false, message: 'No tickets selected' }, { status: 400 });
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
        });

        return NextResponse.json({ success: true, url: session.url });
            
    }catch (error: any) {
        console.error('Stripe Checkout Error:', error);
        return NextResponse.json({ success: false, message: 'Something went wrong' }, { status: 500 });
    }
} 