import { db } from '@/lib/db';

export async function markPaid(transactionId: string) {
  await db.execute(
    `UPDATE Transaction SET status = 'paid', paid_at = NOW() WHERE transaction_id = ?`,
    [transactionId],
  );
  await db.execute(
    `UPDATE Booking SET status = 'paid' WHERE transaction_id = ?`,
    [transactionId],
  );
}