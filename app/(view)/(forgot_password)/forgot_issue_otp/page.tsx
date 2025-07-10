'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState<boolean>(false);
  const [otpError, setOtpError] = useState<string>('');
  
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();

      if (data.success) {
        setMessage('If email is valid, OTP has been sent to your email address.');
        setIsSubmitted(true);
      } else if (!data.success && !data.showError) {
        setMessage('If email is valid, OTP has been sent to your email address.');
        setIsSubmitted(true);
      }
      
      else {
        setError(data.message);
      }
    } catch (err) {
      setError('Network Error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return; // Prevent multiple characters
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setOtpError('');

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all fields are filled
    if (newOtp.every(digit => digit !== '') && newOtp.join('').length === 6) {
      handleOtpSubmit(newOtp.join(''));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpSubmit = async (otpCode: string) => {
    setIsVerifyingOtp(true);
    setOtpError('');
    console.log("otpcode", otpCode);
    try {
      const res = await fetch('/api/forgot-otp', {
        method: 'POST',
        body: JSON.stringify({ email, otp: otpCode }),
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();

      if (data.success) {
        // Redirect to reset password page or handle success
        router.push(`/forgot_reset_password?from=forgot_issue_otp`);
      } 
      else {
        setOtpError(data.message || 'Invalid OTP. Please try again.');
        setOtp(['', '', '', '', '', '']); // Clear OTP fields
        otpRefs.current[0]?.focus(); // Focus first input
      }
    } catch (err) {
      setOtpError('Network Error. Please try again.');
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const resendOtp = async () => {
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch('/api/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();

      if (data.success) {
        setMessage('New OTP sent to your email.');
        setOtp(['', '', '', '', '', '']);
        otpRefs.current[0]?.focus();
      } else {
        setError(data.message || 'Failed to resend OTP.');
      }
    } catch (err) {
      setError('Network Error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        <div className="bg-zinc-900 p-8 rounded-lg shadow-lg w-full max-w-md text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-4">Check Your Email</h2>
            <p className="text-zinc-300 mb-6">
              We've sent a password reset OTP to <strong>{email}</strong>
            </p>
          </div>
          
          {/* OTP Input Section */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Enter OTP</h3>
            <div className="flex justify-center space-x-2 mb-4">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { otpRefs.current[index] = el; }}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  className="w-12 h-12 text-center text-xl font-bold bg-zinc-800 border border-zinc-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isVerifyingOtp}
                />
              ))}
            </div>
            
            {isVerifyingOtp && (
              <div className="text-blue-400 text-sm mb-4">
                Verifying OTP...
              </div>
            )}
            
            {otpError && (
              <div className="text-red-400 text-sm text-center bg-red-900/20 border border-red-800 rounded p-2 mb-4">
                {otpError}
              </div>
            )}

            {message && (
              <div className="text-green-400 text-sm text-center bg-green-900/20 border border-green-800 rounded p-2 mb-4">
                {message}
              </div>
            )}

            {error && (
              <div className="text-red-400 text-sm text-center bg-red-900/20 border border-red-800 rounded p-2 mb-4">
                {error}
              </div>
            )}

            <button
              onClick={resendOtp}
              disabled={isLoading}
              className="text-blue-400 hover:text-blue-300 text-sm underline disabled:text-blue-600"
            >
              {isLoading ? 'Resending...' : 'Resend OTP'}
            </button>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={() => {
                setIsSubmitted(false);
                setEmail('');
                setMessage('');
                setOtp(['', '', '', '', '', '']);
                setOtpError('');
              }}
              className="w-full py-2 bg-zinc-700 hover:bg-zinc-600 text-white font-semibold rounded"
            >
              Try Different Email
            </button>
            
            <Link 
              href="/login"
              className="block w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded text-center"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-black text-white">
      <div className="bg-zinc-900 p-8 rounded-lg shadow-lg w-full max-w-md">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">Forgot Password?</h2>
          <p className="text-zinc-400 text-sm">
            Enter your email address and we'll send you an OTP to reset your password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm mb-1">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your email address"
              required
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm text-center bg-red-900/20 border border-red-800 rounded p-2">
              {error}
            </div>
          )}

          {message && (
            <div className="text-green-400 text-sm text-center bg-green-900/20 border border-green-800 rounded p-2">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 mt-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-semibold rounded"
          >
            {isLoading ? 'Sending...' : 'Send OTP'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link 
            href="/login" 
            className="text-blue-400 hover:text-blue-300 text-sm"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}