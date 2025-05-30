'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ReCAPTCHA from 'react-google-recaptcha';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showRecaptcha, setShowRecaptcha] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setError('');
    setIsLoading(true);

    const loginRequestBody: any = { email, password };
    if (showRecaptcha) {
      loginRequestBody.recaptchaToken = recaptchaToken;
    }

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        body: JSON.stringify(loginRequestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      console.log("data: ", data);

      if (data.requireRecaptcha) {
        setShowRecaptcha(true);
      } else {
        setShowRecaptcha(false);
      }

      if (data.success) {
        // Set SessionStorage for OTP (converts int to str)
        sessionStorage.setItem('otp_user_id', data.userId);
        router.push('/verify-otp'); 
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError ("Network Error. Try again.")
    } finally {
      setIsLoading(false);
    }
  };

    
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-black text-white">
      <div className="bg-zinc-900 p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm mb-1">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm mb-1">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {showRecaptcha &&
          (
            <ReCAPTCHA
            sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ""}
            onChange={(value) => setRecaptchaToken(value)}
          />
          )}

            {error && (
            <div className="text-red-400 text-sm text-center bg-red-900/20 border border-red-800 rounded p-2">
              Error: {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 mt-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded"
          >
            {isLoading ? 'Logging in...' : 'Log In'}
          </button>
        </form>
      </div>
    </div>
  );
}
