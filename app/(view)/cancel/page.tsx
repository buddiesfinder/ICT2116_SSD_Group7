// 'use client';

// import { useEffect } from 'react';
// import { useRouter, useSearchParams } from 'next/navigation';

// export default function CancelPage() {
//   const router = useRouter();
//   const params = useSearchParams();
//   const transaction_id = params.get('transaction_id');

//   useEffect(() => {
//     if (transaction_id) {
//       fetch(`/api/cancel-transaction`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ transaction_id }),
//       });
//     }

//     const timeout = setTimeout(() => {
//       router.push('/event');
//     }, 10000);

//     return () => clearTimeout(timeout);
//   }, [transaction_id]);

//   return (
//     <div className="p-10 text-center text-white">
//       <h1 className="text-2xl font-bold mb-4">Payment Cancelled</h1>
//       <p>Your tickets were released. If you still wish to attend, please book again.</p>
//     </div>
//   );
// }

'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function CancelPage() {
  const router = useRouter();
  const params = useSearchParams();
  const transaction_id = params.get('transaction_id');

  useEffect(() => {
    if (transaction_id) {
      fetch('/api/cancel-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transaction_id }),
      });
    }

    const timeout = setTimeout(() => {
      router.push('/event');
    }, 10000);

    return () => clearTimeout(timeout);
  }, [transaction_id, router]);

  return (
    <div className="p-10 text-center text-white">
      <h1 className="text-2xl font-bold mb-4">Payment Cancelled</h1>
      <p>Your tickets were released. If you still wish to attend, please book again.</p>
    </div>
  );
}

