import './globals.css';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { decodeJwt } from '@/lib/jwt';
import Navbar from './(components)/navbar'; 

export const metadata: Metadata = {
  title: 'Event Booking App',
  description: 'Login and Register Demo',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies(); 
  const token = cookieStore.get('refresh_token')?.value;

  let email: string | null = null;
  if (token) {
    try {
      const { payload } = decodeJwt(token);
      email = payload.user_email ?? null;
    } catch (e) {
      console.error('Invalid token', e);
    }
  }

  return (
    <html lang="en">
      <body className="bg-black text-white">
        <Navbar email={email} />
        <main className="p-6">{children}</main>
      </body>
    </html>
  );
}
