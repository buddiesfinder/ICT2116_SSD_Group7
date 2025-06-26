import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { decodeJwt } from '@/lib/jwt';
import AdminPage from './adminPage'; 

export default async function AdminRoute() {
  const cookieStore = await cookies(); 
  const token = cookieStore.get('refresh_token')?.value;
  if (!token) redirect('/login');

  let payload;
  try {
    ({ payload } = decodeJwt(token));
  } catch {
    // Token is malformed or expired
    redirect('/login');
  }

  // Token is valid, but not admin
  if (payload.role !== 'admin') {
    redirect('/forbidden');
  }

  return <AdminPage />;
}

