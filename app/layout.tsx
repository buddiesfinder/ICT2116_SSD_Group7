// this file is used to define the layout of the application
// things like the navbar, footer, and other components that are common across all pages
import './globals.css';
import { UserProvider } from './(page controller)/(views)/contexts/UserContext';
import Navbar from './(components)/navbar'; 
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Event Booking App',
  description: 'Login and Register Demo',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-black text-white">
        <UserProvider>
          <Navbar />
          <main className="p-6">{children}</main>
        </UserProvider>
      </body>
    </html>
  );
}
