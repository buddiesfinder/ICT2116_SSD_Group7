import { cookies } from 'next/headers';
import { decodeJwt } from '@/lib/jwt';
import ClientPage from './Clientpage';
import ResetPasswordPage from './ResetPasswordPage';

export default async function ProfilePage() {
  const cookieStore = await cookies(); 
  const token = cookieStore.get('refresh_token')?.value ?? null;

  let email: string | null = null;
  let role: string | null = null;


  if (token) {
    try {
      const { payload } = decodeJwt(token);
      email = payload.user_email ?? null;
      role = payload.role ?? null;
    } catch (e) {
      console.error('Invalid token in profile page', e);
    }
  }

  return <>
    <ClientPage email={email} role ={role} /> 
    <ResetPasswordPage token={token}/>
    </>;
}
