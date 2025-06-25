import { cookies } from 'next/headers';
import { decodeJwt } from '@/lib/jwt';
import { db } from '@/lib/db';
import ClientPage from './Clientpage';
import ResetPasswordPage from './ResetPasswordPage';

export default async function ProfilePage() {
  const cookieStore = await cookies(); 
  const token = cookieStore.get('refresh_token')?.value ?? null;

  let email: string | null = null;
  let role: string | null = null;
  let name: string | null = null;

  if (token) {
    try {
      const { payload } = decodeJwt(token);
      email = payload.user_email ?? null;
      role = payload.role ?? null;

      // Get userId from JWT payload
      const userId = payload.userId;
      if (userId) {
        const [rows] = await db.query('SELECT name FROM SSD.User WHERE user_id = ?', [userId]) as [any[], any];
        name = rows[0]?.name ?? null;
      }

    } catch (e) {
      console.error('Invalid token in profile page', e);
    }
  }

  return <>
    <ClientPage email={email} role ={role} name="test name"/> 
    <ResetPasswordPage token={token}/>
    </>;

}
