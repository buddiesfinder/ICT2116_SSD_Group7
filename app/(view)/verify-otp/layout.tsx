import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { verifyRefreshToken } from '@/app/(model)/(auth)/(token)/verifyRefreshToken.route';
import Navbar from '@/app/(components)/navbar';

export const metadata: Metadata = {
  title: 'Verify OTP',
  description: 'Enter your OTP code to verify your account',
};

export default async function VerifyLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('refresh_token')?.value;
  const headerList = await headers();
  const nonce = headerList.get('x-nonce') ?? '';

  let email: string | null = null;
  let role: string | null = null;

  if (token) {
    try {
      const result = await verifyRefreshToken(token);

      if (result.success) {
        // If the token is valid, user should NOT be on the verify page → redirect them
        return redirect('/');
      }
    } catch (e) {
      console.warn('Token error (as expected on /verify):', e);
      // Do nothing — this is expected for OTP routes
    }
  }

  return (
    <html lang="en">
      <head nonce={nonce} />
      <body className="bg-black text-white">
        <Navbar email={email} role={role} />
        <main className="p-6">{children}</main>
      </body>
    </html>
  );
}
