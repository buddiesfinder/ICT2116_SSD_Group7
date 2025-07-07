import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { decodeJwt } from '@/lib/jwt';
import AdminPage from './adminPage'; 
import { verifyRefreshToken } from '@/app/(model)/(auth)/(token)/verifyRefreshToken.route';

export default async function AdminRoute() {
  const cookieStore = await cookies(); 
  const token = cookieStore.get('refresh_token')?.value;
  if (!token) redirect('/login');

  let payload;
  try {
    const { success, message, payload: verifiedPayload } = await verifyRefreshToken(token);
    if (!success) { redirect('/login') }
    payload = verifiedPayload;
  } catch {
    // Token is malformed or expired
    redirect('/login');
  }

  // Token is valid, but not admin
  if (payload.role !== 'owner') {
    redirect('/forbidden');
  }

  return <AdminPage />;
}

