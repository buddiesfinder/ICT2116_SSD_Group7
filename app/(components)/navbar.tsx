'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';
import { useUser } from '@/app/(page controller)/(views)/contexts/UserContext';

const links = [
  { href: '/', label: 'Home' },
  { href: '/search', label: 'Search' },
  { href: '/admin', label: 'Admin' },
  { href: '/profile', label: 'Profile' },
  { href: '/payment', label: 'Payment' },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useUser();

  return (
    <nav className="bg-zinc-900 text-white px-6 py-4 border-b border-zinc-700 flex justify-between items-center">
      {/* Left: Main Links */}
      <ul className="flex gap-6 list-none m-0 p-0">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className={`hover:underline ${
                pathname === link.href ? 'underline font-bold' : ''
              }`}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>

      {/* Right: Auth section */}
      <div className="flex items-center gap-4">
        {!user ? (
          <>
            <Link
              href="/login"
              className={`hover:underline ${
                pathname === '/login' ? 'underline font-bold' : ''
              }`}
            >
              Login
            </Link>
            <Link
              href="/register"
              className={`hover:underline ${
                pathname === '/register' ? 'underline font-bold' : ''
              }`}
            >
              Register
            </Link>
          </>
        ) : (
          <>
            <span className="text-sm text-blue-300">Welcome, {user.email}</span>
            <button
              onClick={logout}
              className="text-red-400 hover:underline text-sm"
            >
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
