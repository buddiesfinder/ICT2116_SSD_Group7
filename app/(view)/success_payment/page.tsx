// // success or failure page after payment

// export default function SuccessPage() {
//   return (
//     <div className="p-10 text-center">
//       <h1 className="text-3xl font-bold"> Payment Successful!</h1>
//       <p className="mt-4">Your tickets have been booked.</p>
//     </div>
//   );
// }
import { redirect } from 'next/navigation';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
});

export default async function SuccessPage(props: { searchParams: any }) {
  const searchParams = await props.searchParams;
  const session_id = searchParams.session_id;

  if (!session_id || Array.isArray(session_id)) {
    redirect('/');
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status !== 'paid') {
      redirect('/');
    }

    return (
      <div className="p-10 text-center">
        <h1 className="text-3xl font-bold">Payment Successful!</h1>
        <p className="mt-4">Your tickets have been booked.</p>
      </div>
    );
  } catch (error) {
    console.error('Stripe error:', error);
    redirect('/');
  }
}


