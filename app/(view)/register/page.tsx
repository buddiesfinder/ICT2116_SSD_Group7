'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { passwordStrengthCheckerAsync } from '@/utils/passwordStrengthChecker';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [passwordStrength, setPasswordStrength] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Registering:', email, password);

    const res = await fetch('/api/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await res.json();

    if (data.success) {
      alert('Registration successful! Redirecting to login...');
      router.push('/login');
    } else {
      alert(data.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-black text-white">
      <div className="bg-zinc-900 p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Create an Account</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block mb-1 text-sm font-medium">Full Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className="w-full px-4 py-2 bg-zinc-800 text-white border border-zinc-700 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block mb-1 text-sm font-medium">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-2 bg-zinc-800 text-white border border-zinc-700 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block mb-1 text-sm font-medium">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={async (e) => {
                const value = e.target.value;
                setPassword(value);
                const { message } = await passwordStrengthCheckerAsync(value);
                setPasswordStrength(message);
              }}
              placeholder="••••••••"
              className="w-full px-4 py-2 bg-zinc-800 text-white border border-zinc-700 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
            <p className={`mt-1 text-sm ${
              passwordStrength.toLowerCase().includes('strong') ? 'text-green-500' :
              passwordStrength.toLowerCase().includes('medium') ? 'text-yellow-500' :
              'text-red-500'
            }`}>
              {passwordStrength || 'Enter a password'}
            </p>
          </div>

          <button
            type="submit"
            className="w-full py-2 mt-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded"
          >
            Register
          </button>
        </form>
      </div>
    </div>
  );
}
