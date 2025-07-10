import { cookies } from 'next/headers';
import { decodeJwt } from '@/lib/jwt';
import { db } from '@/lib/db';
import ClientPage from './Clientpage';
import ResetPasswordPage from './ResetPasswordPage';
import { verifyRefreshToken } from '@/app/(model)/(auth)/(token)/verifyRefreshToken.route';
import { redirect } from 'next/navigation';
import { verify } from 'crypto';
export default async function ProfilePage() {
  const cookieStore = cookies();
  const token = (await cookieStore).get('refresh_token')?.value ?? null;

  if (!token) {
    redirect('/login'); // no token = not logged in
  }

  const { success, payload } = await verifyRefreshToken(token);

  if (!success) {
    redirect('/login'); // invalid token
  }

  const email = payload.user_email ?? null;
  const role = payload.role ?? null;

  let name: string | null = null;
  const userId = payload.userId;

  if (userId) {
    const [rows] = await db.execute('SELECT name FROM User WHERE user_id = ?', [userId]) as [any[], any];
    name = rows[0]?.name ?? null;
  }

  return (
    <>
      <ClientPage email={email} role={role} name={name} />
      <ResetPasswordPage token={token} />
    </>
  );
}
