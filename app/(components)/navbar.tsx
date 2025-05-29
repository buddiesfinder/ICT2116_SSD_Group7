import Link from 'next/link';

const links = [
  { href: '/', label: 'Home' },
  { href: '/event', label: 'Events' },
  { href: '/search', label: 'Search' },
  { href: '/admin', label: 'Admin' },
  { href: '/profile', label: 'Profile' },
  { href: '/payment', label: 'Payment' },
];

export default function Navbar({ email }: { email: string | null }) {


  return (
    <nav className="bg-zinc-900 text-white px-6 py-4 border-b border-zinc-700 flex justify-between items-center">
      <ul className="flex gap-6 list-none m-0 p-0">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className={`hover:underline`}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-4">
        {!email ? (
          <>
            <Link href="/login" className="hover:underline">Login</Link>
            <Link href="/register" className="hover:underline">Register</Link>
          </>
        ) : (
          <>
            <span className="text-sm text-blue-300">Welcome, {email}</span>
            <form action="/api/logout" method="POST">
              <button type="submit" className="text-red-400 hover:underline text-sm">
                Logout
              </button>
            </form>
          </>
        )}
      </div>
    </nav>
  );
}
