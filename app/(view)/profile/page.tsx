import { cookies } from 'next/headers';
import { decodeJwt } from '@/lib/jwt';
import { db } from '@/lib/db';
import ClientPage from './Clientpage';
import ResetPasswordPage from './ResetPasswordPage';
import { verifyRefreshToken } from '@/app/(model)/(auth)/(token)/verifyRefreshToken.route';

export default async function ProfilePage() {
  const cookieStore = await cookies(); 
  const token = cookieStore.get('refresh_token')?.value ?? null;

  let email: string | null = null;
  let role: string | null = null;
  let name: string | null = null;

  if (token) {
    try {
      // const { payload } = decodeJwt(token);
      const { success, message, payload } = await verifyRefreshToken(token);

      if (!success) {
        cookieStore.set('refresh_token', '', {
          path: '/',
          maxAge: 0,
          httpOnly: true,
          secure: true,
          sameSite: 'lax',
        });
      } else if (payload) {
        email = payload.user_email ?? null;
        role  = payload.role       ?? null;
    }

      email = payload.user_email ?? null;
      role = payload.role ?? null;

      // Get userId from JWT payload
      const userId = payload.userId;
      if (userId) {
        const [rows] = await db.execute('SELECT name FROM User WHERE user_id = ?', [userId]) as [any[], any];
        name = rows[0]?.name ?? null;
      }

    } catch (e) {
      console.error('Invalid token in profile page', e);
    }
  }

  return <>
    <ClientPage email={email} role ={role} name={name}/> 
    <ResetPasswordPage token={token}/>
    </>;

}
